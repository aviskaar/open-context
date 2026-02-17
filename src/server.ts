import express, { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Ollama } from 'ollama';
import { ZipExtractor } from './extractor.js';
import { ChatGPTParser } from './parsers/chatgpt.js';
import { ConversationNormalizer } from './parsers/normalizer.js';
import { OllamaPreferenceAnalyzer } from './analyzers/ollama-preferences.js';
import { createStore } from './mcp/store.js';
import { loadSchema, saveSchema } from './mcp/schema.js';
import { createObserver } from './mcp/observer.js';
import { buildSelfModel } from './mcp/awareness.js';
import { ContextAnalyzer } from './mcp/analyzer.js';
import { createControlPlane } from './mcp/control-plane.js';
import { selfImprovementTick } from './mcp/improver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Multer: save uploads to a temp dir on disk (ZipExtractor needs a file path)
const uploadDir = path.join(os.tmpdir(), 'opencontext-uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Ollama host — defaults to host.docker.internal so containers reach the host machine
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://host.docker.internal:11434';

// Context store
const storePath =
  process.env.OPENCONTEXT_STORE_PATH ??
  path.join(os.homedir(), '.opencontext', 'contexts.json');
const observer = createObserver();
const store = createStore(storePath, observer);
const analyzer = new ContextAnalyzer(
  process.env.OLLAMA_MODEL ?? 'gpt-oss:20b',
  OLLAMA_HOST,
);

// Preferences files live alongside the context store
const prefsDir = path.dirname(storePath);
const prefsJsonPath = path.join(prefsDir, 'preferences.json');
const prefsMdPath = path.join(prefsDir, 'preferences.md');
const memoryMdPath = path.join(prefsDir, 'memory.md');

function buildPreferencesMd(p: Record<string, unknown>): string {
  const cs = (p.communicationStyle ?? {}) as Record<string, unknown>;
  const bp = (p.behaviorPreferences ?? {}) as Record<string, unknown>;
  const toneMap: Record<string, string> = {
    formal: 'formal and professional', casual: 'casual and conversational',
    neutral: 'clear and neutral', friendly: 'warm and approachable',
    professional: 'precise and business-like',
  };
  const detailMap: Record<string, string> = {
    concise: 'concise responses that get to the point quickly',
    balanced: 'balanced responses with enough detail to be thorough but not verbose',
    thorough: 'detailed, comprehensive explanations that cover edge cases',
  };
  const lines: string[] = [];
  if (cs.tone) {
    lines.push(
      `I prefer ${toneMap[cs.tone as string] ?? cs.tone} communication with ${detailMap[cs.detailLevel as string] ?? cs.detailLevel}.`
    );
  }
  if (cs.useCodeExamples) lines.push('When explaining technical concepts, please provide code examples where relevant.');
  if (cs.preferStepByStep) lines.push('I prefer step-by-step instructions for complex tasks.');
  if (cs.responseFormat === 'markdown') lines.push('Please use markdown formatting in responses.');
  else if (cs.responseFormat === 'plain') lines.push('Please keep responses in plain text without heavy formatting.');
  if (bp.proactiveness === 'proactive') lines.push('Feel free to proactively suggest improvements or point out potential issues.');
  else if (bp.proactiveness === 'minimal') lines.push('Please focus on answering exactly what I ask without adding unsolicited suggestions.');
  if (bp.warnAboutRisks) lines.push('Please warn me about potential risks or pitfalls in my approach.');
  if (bp.suggestAlternatives) lines.push('When relevant, suggest alternative approaches I might consider.');
  const custom = ((p.customInstructions as string) ?? '').trim();
  if (custom) { lines.push(''); lines.push(custom); }
  return lines.join('\n');
}

function buildMemoryMd(p: Record<string, unknown>): string {
  const wc = (p.workContext ?? {}) as Record<string, unknown>;
  const pc = (p.personalContext ?? {}) as Record<string, unknown>;
  const cf = (p.currentFocus ?? {}) as Record<string, unknown>;
  const tp = (p.technicalProfile ?? {}) as Record<string, unknown>;
  const sections: string[] = [];

  sections.push('Work context:');
  const workParts: string[] = [];
  if (wc.role) workParts.push(`User works as a ${wc.role}`);
  if (wc.industry) workParts.push(` in the ${wc.industry} industry`);
  if (wc.description) workParts.push(`. ${wc.description}`);
  const langs = tp.primaryLanguages as string[] | undefined;
  if (langs?.length) workParts.push(`. Primary languages: ${langs.join(', ')}`);
  const fw = tp.frameworks as string[] | undefined;
  if (fw?.length) workParts.push(`. Frameworks: ${fw.join(', ')}`);
  sections.push(workParts.join('') || 'No work context provided.');

  sections.push('');
  sections.push('Personal context:');
  const personalParts: string[] = [];
  if (pc.background) personalParts.push(pc.background as string);
  const interests = pc.interests as string[] | undefined;
  if (interests?.length) personalParts.push(`Interests include: ${interests.join(', ')}.`);
  if (tp.experienceLevel) personalParts.push(`Technical experience level: ${tp.experienceLevel}.`);
  sections.push(personalParts.join(' ') || 'No personal context provided.');

  sections.push('');
  sections.push('Top of mind:');
  const focusParts: string[] = [];
  const projects = cf.projects as string[] | undefined;
  if (projects?.length) focusParts.push(`Active projects: ${projects.join(', ')}.`);
  const goals = cf.goals as string[] | undefined;
  if (goals?.length) focusParts.push(`Goals: ${goals.join(', ')}.`);
  if (cf.topOfMind) focusParts.push(cf.topOfMind as string);
  sections.push(focusParts.join(' ') || 'No current focus provided.');

  return sections.join('\n');
}

// Serve built UI static files
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ollamaHost: OLLAMA_HOST, store: storePath });
});

// ---------------------------------------------------------------------------
// Ollama — list available models on the host
// ---------------------------------------------------------------------------

app.get('/api/ollama/models', async (_req: Request, res: Response) => {
  try {
    const ollama = new Ollama({ host: OLLAMA_HOST });
    const { models } = await ollama.list();
    res.json(
      models.map((m) => ({
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
      })),
    );
  } catch {
    res.status(503).json({ error: `Ollama unreachable at ${OLLAMA_HOST}` });
  }
});

// ---------------------------------------------------------------------------
// Convert — upload a ChatGPT ZIP and run the full pipeline
// ---------------------------------------------------------------------------

app.post('/api/convert', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const ollamaHost = (req.body.ollamaHost as string | undefined) ?? OLLAMA_HOST;
  const model = (req.body.model as string | undefined) ?? process.env.OLLAMA_MODEL ?? 'gpt-oss:20b';
  const skipPreferences = req.body.skipPreferences === 'true';

  const extractor = new ZipExtractor();
  let tempDir: string | undefined;

  try {
    const extracted = await extractor.extractZip(req.file.path);
    tempDir = extracted.tempDir;

    const parser = new ChatGPTParser();
    const chatGPTConvs = parser.parseConversations(extracted.conversationsPath);

    const normalizer = new ConversationNormalizer();
    const normalized = chatGPTConvs
      .map((c) => normalizer.normalize(c))
      .filter((c) => normalizer.isValidConversation(c));

    let preferences = '';
    let memory = '';

    const analyzer = new OllamaPreferenceAnalyzer(model, ollamaHost);
    if (!skipPreferences) {
      try {
        preferences = await analyzer.analyzePreferences(normalized);
        memory = await analyzer.analyzeMemory(normalized);
      } catch {
        preferences = analyzer.generateBasicPreferences(normalized);
        memory = analyzer.generateBasicMemory(normalized);
      }
    } else {
      preferences = analyzer.generateBasicPreferences(normalized);
      memory = analyzer.generateBasicMemory(normalized);
    }

    res.json({
      conversations: normalized.map((c) => ({
        id: c.id,
        title: c.title,
        created: c.created,
        updated: c.updated,
        messageCount: c.messages.length,
      })),
      preferences,
      memory,
      stats: {
        total: chatGPTConvs.length,
        processed: normalized.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Conversion failed' });
  } finally {
    fs.rmSync(req.file.path, { force: true });
    if (tempDir) extractor.cleanup(tempDir);
  }
});

// ---------------------------------------------------------------------------
// Preferences — stored as preferences.json + preferences.md + memory.md
// ---------------------------------------------------------------------------

app.get('/api/preferences', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(prefsJsonPath)) {
      res.json(JSON.parse(fs.readFileSync(prefsJsonPath, 'utf-8')));
    } else {
      res.json(null);
    }
  } catch {
    res.status(500).json({ error: 'Failed to read preferences' });
  }
});

app.put('/api/preferences', (req: Request, res: Response) => {
  try {
    const prefs = req.body as Record<string, unknown>;
    fs.mkdirSync(prefsDir, { recursive: true });
    fs.writeFileSync(prefsJsonPath, JSON.stringify(prefs, null, 2) + '\n');
    fs.writeFileSync(prefsMdPath, buildPreferencesMd(prefs) + '\n');
    fs.writeFileSync(memoryMdPath, buildMemoryMd(prefs) + '\n');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// ---------------------------------------------------------------------------
// Contexts — CRUD for the MCP context store
// ---------------------------------------------------------------------------

app.get('/api/contexts', (req: Request, res: Response) => {
  const tag = req.query.tag as string | undefined;
  res.json(store.listContexts(tag));
});

app.post('/api/contexts', (req: Request, res: Response) => {
  const { content, tags, source, bubbleId } = req.body as {
    content: string;
    tags?: string[];
    source?: string;
    bubbleId?: string;
  };
  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  res.status(201).json(store.saveContext(content, tags, source, bubbleId));
});

app.get('/api/contexts/search', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: 'q query param required' });
    return;
  }
  res.json(store.searchContexts(q));
});

app.get('/api/contexts/:id', (req: Request, res: Response) => {
  const entry = store.getContext(req.params['id'] as string);
  if (!entry) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(entry);
});

app.put('/api/contexts/:id', (req: Request, res: Response) => {
  const { content, tags, bubbleId } = req.body as {
    content: string;
    tags?: string[];
    bubbleId?: string | null;
  };
  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  const updated = store.updateContext(req.params['id'] as string, content, tags, bubbleId);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/contexts/:id', (req: Request, res: Response) => {
  const deleted = store.deleteContext(req.params['id'] as string);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Bubbles — CRUD for project workspaces
// ---------------------------------------------------------------------------

app.get('/api/bubbles', (_req: Request, res: Response) => {
  const bubbles = store.listBubbles();
  const withCounts = bubbles.map((b) => ({
    ...b,
    contextCount: store.listContextsByBubble(b.id).length,
  }));
  res.json(withCounts);
});

app.post('/api/bubbles', (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  res.status(201).json(store.createBubble(name, description));
});

app.get('/api/bubbles/:id', (req: Request, res: Response) => {
  const bubble = store.getBubble(req.params['id'] as string);
  if (!bubble) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    ...bubble,
    contextCount: store.listContextsByBubble(bubble.id).length,
  });
});

app.get('/api/bubbles/:id/contexts', (req: Request, res: Response) => {
  const bubble = store.getBubble(req.params['id'] as string);
  if (!bubble) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(store.listContextsByBubble(req.params['id'] as string));
});

app.put('/api/bubbles/:id', (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const updated = store.updateBubble(req.params['id'] as string, name, description);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/bubbles/:id', (req: Request, res: Response) => {
  const deleteContexts = req.query['deleteContexts'] === 'true';
  const deleted = store.deleteBubble(req.params['id'] as string, deleteContexts);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Schema — user-defined context types
// ---------------------------------------------------------------------------

app.get('/api/schema', (_req: Request, res: Response) => {
  const schema = loadSchema();
  res.json(schema ?? { version: 1, types: [] });
});

app.put('/api/schema', (req: Request, res: Response) => {
  try {
    const schema = req.body as import('./mcp/schema.js').Schema;
    if (!schema || !Array.isArray(schema.types)) {
      res.status(400).json({ error: 'Invalid schema: must have types array' });
      return;
    }
    saveSchema(schema);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save schema' });
  }
});

// ---------------------------------------------------------------------------
// Awareness — self-model
// ---------------------------------------------------------------------------

app.get('/api/awareness', (_req: Request, res: Response) => {
  try {
    const schema = loadSchema();
    const model = buildSelfModel(store, schema, observer);
    res.json(model);
  } catch {
    res.status(500).json({ error: 'Failed to build self-model' });
  }
});

// ---------------------------------------------------------------------------
// Analyze — on-demand Ollama analysis
// ---------------------------------------------------------------------------

app.post('/api/analyze', async (req: Request, res: Response) => {
  const { action, params } = req.body as { action: string; params?: Record<string, unknown> };
  try {
    if (action === 'contradictions') {
      const entries = store.listContexts().filter((e) => !e.archived);
      const result = await analyzer.detectContradictions(entries);
      res.json({ result, source: 'ollama' });
    } else if (action === 'suggest_schema') {
      const untyped = store.listContexts().filter((e) => !e.contextType && !e.archived);
      const result = await analyzer.suggestSchemaTypes(untyped);
      res.json({ result, source: 'ollama' });
    } else if (action === 'summarize') {
      const entries = store.listContexts().filter((e) => !e.archived);
      const result = await analyzer.summarizeContext(entries, params?.focus as string);
      res.json({ result, source: 'ollama' });
    } else {
      res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ---------------------------------------------------------------------------
// Pending actions — human-in-the-loop governance
// ---------------------------------------------------------------------------

app.get('/api/pending-actions', (_req: Request, res: Response) => {
  const controlPlane = createControlPlane(observer);
  res.json(controlPlane.listPending());
});

app.post('/api/pending-actions/:id/approve', async (req: Request, res: Response) => {
  const controlPlane = createControlPlane(observer);
  const { executed, result, action: approvedAction } = controlPlane.approve(req.params['id'] as string);
  if (executed && approvedAction) {
    try {
      const { executeImprovement } = await import('./mcp/improver.js');
      const schema = loadSchema();
      await executeImprovement(approvedAction.action, store, schema, observer);
      res.json({ ok: true, result });
    } catch (err) {
      res.status(500).json({ error: `Approved but execution failed: ${err}` });
    }
  } else {
    res.status(404).json({ error: result });
  }
});

app.post('/api/pending-actions/:id/dismiss', (req: Request, res: Response) => {
  const controlPlane = createControlPlane(observer);
  const { reason } = req.body as { reason?: string };
  const dismissed = controlPlane.dismiss(req.params['id'] as string, reason);
  if (dismissed) {
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'Action not found or already resolved' });
  }
});

app.post('/api/pending-actions/bulk', async (req: Request, res: Response) => {
  const controlPlane = createControlPlane(observer);
  const { action_ids, decision, reason } = req.body as {
    action_ids: string[];
    decision: 'approve' | 'dismiss';
    reason?: string;
  };
  if (!Array.isArray(action_ids) || !decision) {
    res.status(400).json({ error: 'action_ids array and decision required' });
    return;
  }
  if (decision === 'approve') {
    const schema = loadSchema();
    const { executeImprovement } = await import('./mcp/improver.js');
    const results = [];
    for (const id of action_ids) {
      const { executed, result, action: approvedAction } = controlPlane.approve(id);
      if (executed && approvedAction) {
        try {
          await executeImprovement(approvedAction.action, store, schema, observer);
          results.push({ id, ok: true });
        } catch {
          results.push({ id, ok: false, error: 'Execution failed' });
        }
      } else {
        results.push({ id, ok: false, error: result });
      }
    }
    res.json({ results });
  } else {
    controlPlane.bulkDismiss(action_ids, reason);
    res.json({ dismissed: action_ids.length });
  }
});

// ---------------------------------------------------------------------------
// SPA fallback — all non-API routes serve the React app
// ---------------------------------------------------------------------------

app.get('/{*splat}', (_req: Request, res: Response) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'UI not found — run the build first' });
  }
});

// Export app for testing (supertest imports it without starting the server)
export { app };

// ---------------------------------------------------------------------------
// Start — skipped when imported by tests (NODE_ENV=test set by Vitest)
// ---------------------------------------------------------------------------

let tickInterval: NodeJS.Timeout | null = null;

if (process.env.NODE_ENV !== 'test') {
  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`opencontext server  →  http://0.0.0.0:${PORT}`);
    console.log(`Ollama host         →  ${OLLAMA_HOST}`);
    console.log(`Context store       →  ${storePath}`);
    console.log(`UI                  →  ${fs.existsSync(publicDir) ? 'served from /public' : 'not built'}`);
  });

  const ENABLE_BACKGROUND = process.env.OPENCONTEXT_BACKGROUND !== 'false';
  const TICK_INTERVAL = parseInt(process.env.OPENCONTEXT_TICK_INTERVAL ?? '300000', 10);

  if (ENABLE_BACKGROUND) {
    tickInterval = setInterval(async () => {
      try {
        const schema = loadSchema();
        await selfImprovementTick(store, schema, observer, analyzer);
      } catch (error) {
        console.error('[opencontext] self-improvement tick failed:', error);
      }
    }, TICK_INTERVAL);
    console.log(`Self-improvement    →  enabled (every ${TICK_INTERVAL / 1000}s)`);
  }

  function gracefulShutdown() {
    if (tickInterval) clearInterval(tickInterval);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000);
  }

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}
