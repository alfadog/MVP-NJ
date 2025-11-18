const BEST_LEVEL_KEY = 'memory_matrix_best_level';
const BEST_SCORE_KEY = 'memory_matrix_best_score';
const RESULTS_KEY = 'memory_matrix_results_v1';

export interface ResultEntry {
  score: number;
  level: number;
  rank: number;
  achievedAt: number;
}

export interface RecordedResult {
  previousBest: ResultEntry | null;
  results: ResultEntry[];
  entry: ResultEntry;
}

export function getResultHistory(): ResultEntry[] {
  return readResults();
}

export function recordResult(score: number, level: number): RecordedResult {
  const sanitizedScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const sanitizedLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;

  const existing = readResults();
  const previousBest = existing.length > 0 ? { ...existing[0] } : null;

  const timestamp = Date.now();
  const newEntry: ResultEntry = {
    score: sanitizedScore,
    level: sanitizedLevel,
    rank: 0,
    achievedAt: timestamp,
  };

  const combined = [...existing.map((item) => ({ ...item })), newEntry];
  const sorted = sortAndRank(combined);

  const trimmed = sorted.slice(0, 10).map((item) => ({ ...item }));
  saveResults(trimmed);

  const best = trimmed[0];
  if (best) {
    setBestScore(best.score);
  }

  const storedEntry = sorted.find((item) => item === newEntry) ?? newEntry;

  return {
    previousBest,
    results: trimmed,
    entry: { ...storedEntry },
  };
}

export function getBestLevel(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  try {
    const raw = window.localStorage.getItem(BEST_LEVEL_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  } catch (error) {
    console.warn('Unable to read best level from storage:', error);
    return 1;
  }
}

export function setBestLevel(level: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(BEST_LEVEL_KEY, String(level));
  } catch (error) {
    console.warn('Unable to write best level to storage:', error);
  }
}

export function getBestScore(): number {
  const history = readResults();
  if (history.length > 0) {
    return history[0].score;
  }

  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch (error) {
    console.warn('Unable to read best score from storage:', error);
    return 0;
  }
}

export function setBestScore(score: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch (error) {
    console.warn('Unable to write best score to storage:', error);
  }
}

function readResults(): ResultEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RESULTS_KEY);
    if (!raw) {
      return ensureLegacyResult();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return ensureLegacyResult();
    }

    const normalized = parsed
      .map((item) => normalizeResult(item))
      .filter((entry): entry is ResultEntry => entry !== null);

    if (normalized.length === 0) {
      return ensureLegacyResult();
    }

    return sortAndRank(normalized.map((item) => ({ ...item })));
  } catch (error) {
    console.warn('Unable to read results from storage:', error);
    return ensureLegacyResult();
  }
}

function saveResults(results: ResultEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (error) {
    console.warn('Unable to write results to storage:', error);
  }
}

function normalizeResult(value: unknown): ResultEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const input = value as Partial<ResultEntry> & { score?: unknown; level?: unknown; achievedAt?: unknown; rank?: unknown };
  const score = Number.parseInt(String(input.score ?? ''), 10);
  const level = Number.parseInt(String(input.level ?? ''), 10);
  const achievedAt = Number.parseInt(String(input.achievedAt ?? ''), 10);

  if (!Number.isFinite(score) || score < 0 || !Number.isFinite(level) || level < 1) {
    return null;
  }

  const entry: ResultEntry = {
    score,
    level,
    rank: 0,
    achievedAt: Number.isFinite(achievedAt) ? achievedAt : 0,
  };

  return entry;
}

function sortAndRank(results: ResultEntry[]): ResultEntry[] {
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.achievedAt - b.achievedAt;
  });

  results.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return results;
}

function ensureLegacyResult(): ResultEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return [];
    }

    const bestLevelRaw = window.localStorage.getItem(BEST_LEVEL_KEY);
    const bestLevelParsed = bestLevelRaw ? Number.parseInt(bestLevelRaw, 10) : NaN;

    const fallback: ResultEntry = {
      score: parsed,
      level: Number.isFinite(bestLevelParsed) && bestLevelParsed > 0 ? bestLevelParsed : 1,
      rank: 1,
      achievedAt: 0,
    };

    saveResults([fallback]);
    return [fallback];
  } catch (error) {
    console.warn('Unable to migrate legacy results:', error);
    return [];
  }
}
