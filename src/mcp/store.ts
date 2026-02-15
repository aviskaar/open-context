import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { ContextEntry, ContextStore, Bubble } from './types.js';

const STORE_VERSION = 1;

function getDefaultStorePath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  return join(home, '.opencontext', 'contexts.json');
}

export function createStore(storePath?: string) {
  const filePath = storePath || getDefaultStorePath();

  function load(): ContextStore {
    if (!existsSync(filePath)) {
      return { version: STORE_VERSION, entries: [], bubbles: [] };
    }
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as ContextStore;
    // Migrate stores that predate the bubbles field
    if (!parsed.bubbles) {
      parsed.bubbles = [];
    }
    return parsed;
  }

  function save(store: ContextStore): void {
    const directory = dirname(filePath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  // ---------------------------------------------------------------------------
  // Context CRUD
  // ---------------------------------------------------------------------------

  function saveContext(
    content: string,
    tags: string[] = [],
    source: string = 'chat',
    bubbleId?: string,
  ): ContextEntry {
    const store = load();
    const now = new Date().toISOString();
    const entry: ContextEntry = {
      id: randomUUID(),
      content,
      tags,
      source,
      createdAt: now,
      updatedAt: now,
    };
    if (bubbleId !== undefined) {
      entry.bubbleId = bubbleId;
    }
    store.entries.push(entry);
    save(store);
    return entry;
  }

  function recallContext(query: string): ContextEntry[] {
    const store = load();
    const lowerQuery = query.toLowerCase();
    return store.entries.filter(
      (entry) =>
        entry.content.toLowerCase().includes(lowerQuery) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  function listContexts(tag?: string): ContextEntry[] {
    const store = load();
    if (!tag) {
      return store.entries;
    }
    const lowerTag = tag.toLowerCase();
    return store.entries.filter((entry) =>
      entry.tags.some((t) => t.toLowerCase() === lowerTag),
    );
  }

  function listContextsByBubble(bubbleId: string): ContextEntry[] {
    const store = load();
    return store.entries.filter((entry) => entry.bubbleId === bubbleId);
  }

  function deleteContext(id: string): boolean {
    const store = load();
    const initialLength = store.entries.length;
    store.entries = store.entries.filter((entry) => entry.id !== id);
    if (store.entries.length < initialLength) {
      save(store);
      return true;
    }
    return false;
  }

  function searchContexts(query: string): ContextEntry[] {
    const store = load();
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(Boolean);
    return store.entries.filter((entry) => {
      const text = `${entry.content} ${entry.tags.join(' ')} ${entry.source}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }

  function getContext(id: string): ContextEntry | undefined {
    const store = load();
    return store.entries.find((entry) => entry.id === id);
  }

  function updateContext(
    id: string,
    content: string,
    tags?: string[],
    bubbleId?: string | null,
  ): ContextEntry | undefined {
    const store = load();
    const entry = store.entries.find((e) => e.id === id);
    if (!entry) {
      return undefined;
    }
    entry.content = content;
    if (tags !== undefined) {
      entry.tags = tags;
    }
    if (bubbleId !== undefined) {
      if (bubbleId === null) {
        delete entry.bubbleId;
      } else {
        entry.bubbleId = bubbleId;
      }
    }
    entry.updatedAt = new Date().toISOString();
    save(store);
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Bubble CRUD
  // ---------------------------------------------------------------------------

  function createBubble(name: string, description?: string): Bubble {
    const store = load();
    const now = new Date().toISOString();
    const bubble: Bubble = {
      id: randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    };
    if (description !== undefined) {
      bubble.description = description;
    }
    store.bubbles.push(bubble);
    save(store);
    return bubble;
  }

  function listBubbles(): Bubble[] {
    return load().bubbles;
  }

  function getBubble(id: string): Bubble | undefined {
    return load().bubbles.find((b) => b.id === id);
  }

  function updateBubble(id: string, name: string, description?: string): Bubble | undefined {
    const store = load();
    const bubble = store.bubbles.find((b) => b.id === id);
    if (!bubble) {
      return undefined;
    }
    bubble.name = name;
    if (description !== undefined) {
      bubble.description = description;
    }
    bubble.updatedAt = new Date().toISOString();
    save(store);
    return bubble;
  }

  function deleteBubble(id: string, deleteContexts = false): boolean {
    const store = load();
    const initialLength = store.bubbles.length;
    store.bubbles = store.bubbles.filter((b) => b.id !== id);
    if (store.bubbles.length === initialLength) {
      return false;
    }
    if (deleteContexts) {
      store.entries = store.entries.filter((e) => e.bubbleId !== id);
    } else {
      // Unassign contexts from the deleted bubble
      store.entries.forEach((e) => {
        if (e.bubbleId === id) {
          delete e.bubbleId;
        }
      });
    }
    save(store);
    return true;
  }

  return {
    // contexts
    saveContext,
    recallContext,
    listContexts,
    listContextsByBubble,
    deleteContext,
    searchContexts,
    getContext,
    updateContext,
    // bubbles
    createBubble,
    listBubbles,
    getBubble,
    updateBubble,
    deleteBubble,
    // internals
    load,
    filePath,
  };
}
