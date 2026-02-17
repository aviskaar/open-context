import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface ObservationEvent {
  timestamp: string;
  action: 'read' | 'write' | 'update' | 'delete' | 'query_miss';
  tool: string;
  contextType?: string;
  entryIds?: string[];
  query?: string;
  agent?: string;
  useful?: boolean;
}

export interface SelfImprovementRecord {
  timestamp: string;
  actions: Array<{ type: string; count: number }>;
  autoExecuted?: boolean;
}

export interface ObservationLog {
  events: ObservationEvent[];
  summary: {
    totalReads: number;
    totalWrites: number;
    totalMisses: number;
    missedQueries: string[];
    missedQueryCount: Record<string, number>;
    typeReadFrequency: Record<string, number>;
    typeWriteFrequency: Record<string, number>;
    lastActivity: string;
  };
  improvements: SelfImprovementRecord[];
  pendingActions: import('./control-plane.js').PendingAction[];
  protections: import('./control-plane.js').Protection[];
  schemaCache?: {
    analysisResults?: Record<string, unknown>;
    lastAnalysis?: string;
  };
}

const MAX_EVENTS = 1000;
const TRIM_TO = 500;

function getDefaultObserverPath(): string {
  return join(homedir(), '.opencontext', 'awareness.json');
}

function emptySummary(): ObservationLog['summary'] {
  return {
    totalReads: 0,
    totalWrites: 0,
    totalMisses: 0,
    missedQueries: [],
    missedQueryCount: {},
    typeReadFrequency: {},
    typeWriteFrequency: {},
    lastActivity: new Date().toISOString(),
  };
}

export function createObserver(observerPath?: string) {
  const filePath = observerPath ?? getDefaultObserverPath();

  function loadLog(): ObservationLog {
    if (!existsSync(filePath)) {
      return {
        events: [],
        summary: emptySummary(),
        improvements: [],
        pendingActions: [],
        protections: [],
      };
    }
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ObservationLog>;
      return {
        events: parsed.events ?? [],
        summary: parsed.summary ?? emptySummary(),
        improvements: parsed.improvements ?? [],
        pendingActions: parsed.pendingActions ?? [],
        protections: parsed.protections ?? [],
        schemaCache: parsed.schemaCache,
      };
    } catch {
      return {
        events: [],
        summary: emptySummary(),
        improvements: [],
        pendingActions: [],
        protections: [],
      };
    }
  }

  function persistLog(log: ObservationLog): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8');
  }

  function log(event: Omit<ObservationEvent, 'timestamp'>): void {
    const fullEvent: ObservationEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    const obsLog = loadLog();
    obsLog.events.push(fullEvent);

    // Update summary
    const s = obsLog.summary;
    s.lastActivity = fullEvent.timestamp;

    if (event.action === 'read') {
      s.totalReads++;
      if (event.contextType) {
        s.typeReadFrequency[event.contextType] = (s.typeReadFrequency[event.contextType] ?? 0) + 1;
      }
    } else if (event.action === 'write') {
      s.totalWrites++;
      if (event.contextType) {
        s.typeWriteFrequency[event.contextType] = (s.typeWriteFrequency[event.contextType] ?? 0) + 1;
      }
    } else if (event.action === 'query_miss') {
      s.totalMisses++;
      if (event.query) {
        const q = event.query;
        s.missedQueryCount[q] = (s.missedQueryCount[q] ?? 0) + 1;
        if (!s.missedQueries.includes(q)) {
          s.missedQueries.push(q);
        }
      }
    }

    // Rotate if needed
    if (obsLog.events.length > MAX_EVENTS) {
      obsLog.events = obsLog.events.slice(obsLog.events.length - TRIM_TO);
    }

    persistLog(obsLog);
  }

  function logSelfImprovement(record: SelfImprovementRecord): void {
    const obsLog = loadLog();
    obsLog.improvements.push(record);
    // Keep at most 200 improvement records
    if (obsLog.improvements.length > 200) {
      obsLog.improvements = obsLog.improvements.slice(-100);
    }
    persistLog(obsLog);
  }

  function getSummary(): ObservationLog['summary'] {
    return loadLog().summary;
  }

  function getMissedQueries(): string[] {
    const s = loadLog().summary;
    return s.missedQueries;
  }

  function getTypePopularity(): Record<string, { reads: number; writes: number }> {
    const s = loadLog().summary;
    const allTypes = new Set([
      ...Object.keys(s.typeReadFrequency),
      ...Object.keys(s.typeWriteFrequency),
    ]);
    const result: Record<string, { reads: number; writes: number }> = {};
    for (const t of allTypes) {
      result[t] = {
        reads: s.typeReadFrequency[t] ?? 0,
        writes: s.typeWriteFrequency[t] ?? 0,
      };
    }
    return result;
  }

  function rotateIfNeeded(): void {
    const obsLog = loadLog();
    if (obsLog.events.length > MAX_EVENTS) {
      obsLog.events = obsLog.events.slice(obsLog.events.length - TRIM_TO);
      persistLog(obsLog);
    }
  }

  function getRecentImprovements(since?: string): SelfImprovementRecord[] {
    const obsLog = loadLog();
    if (!since) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return obsLog.improvements.filter((r) => r.timestamp >= yesterday);
    }
    return obsLog.improvements.filter((r) => r.timestamp >= since);
  }

  function loadRaw(): ObservationLog {
    return loadLog();
  }

  function persistRaw(log: ObservationLog): void {
    persistLog(log);
  }

  return {
    log,
    logSelfImprovement,
    getSummary,
    getMissedQueries,
    getTypePopularity,
    rotateIfNeeded,
    getRecentImprovements,
    loadRaw,
    persistRaw,
    filePath,
  };
}
