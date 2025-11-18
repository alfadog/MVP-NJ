import type { GameState, LevelState } from './types';

const BASE_PATTERN_MS = 1000;

const DEFAULT_RANDOM = () => Math.random();

export function startSession(random: () => number = DEFAULT_RANDOM): GameState {
  return {
    level: 1,
    score: 0,
    random,
    mistakes: 0,
  };
}

export function startLevel(state: GameState): LevelState {
  const { columns, rows } = getGridDimensions(state.level);
  const totalCells = columns * rows;
  const needed = Math.min(state.level + 2, totalCells);
  const targets = new Set<number>();

  state.mistakes = 0;

  while (targets.size < needed) {
    const idx = Math.floor(state.random() * totalCells);
    targets.add(idx);
  }

  return {
    level: state.level,
    columns,
    rows,
    total: totalCells,
    targets,
    picked: new Set<number>(),
    wrong: new Set<number>(),
  };
}

export function checkPick(level: LevelState, cellIndex: number): 'ok' | 'duplicate' | 'wrong' | 'complete' {
  if (level.picked.has(cellIndex) || level.wrong.has(cellIndex)) {
    return 'duplicate';
  }

  if (!level.targets.has(cellIndex)) {
    level.wrong.add(cellIndex);
    return 'wrong';
  }

  level.picked.add(cellIndex);

  if (level.picked.size === level.targets.size) {
    return 'complete';
  }

  return 'ok';
}

export function nextLevel(state: GameState): LevelState {
  state.level += 1;
  return startLevel(state);
}

export function levelDown(state: GameState): LevelState {
  state.level = Math.max(1, state.level - 1);
  return startLevel(state);
}

export function getPatternDuration(level: number): number {
  const increments = Math.max(0, Math.floor((level - 1) / 2));
  const seconds = 2 + increments;
  return seconds * BASE_PATTERN_MS;
}

function getGridDimensions(level: number): { columns: number; rows: number } {
  const progression: Array<{ columns: number; rows: number }> = [
    { columns: 3, rows: 3 }, // Level 1
    { columns: 3, rows: 4 }, // Level 2
    { columns: 4, rows: 4 }, // Level 3
    { columns: 4, rows: 5 }, // Level 4
    { columns: 5, rows: 5 }, // Level 5
    { columns: 5, rows: 6 }, // Level 6
    { columns: 6, rows: 6 }, // Level 7
    { columns: 6, rows: 6 }, // Level 8
    { columns: 6, rows: 7 }, // Level 9
    { columns: 6, rows: 7 }, // Level 10
    { columns: 6, rows: 8 }, // Level 11
    { columns: 6, rows: 8 }, // Level 12
    { columns: 7, rows: 7 }, // Level 13
    { columns: 7, rows: 7 }, // Level 14
    { columns: 7, rows: 8 }, // Level 15
    { columns: 7, rows: 8 }, // Level 16
    { columns: 7, rows: 9 }, // Level 17
    { columns: 7, rows: 9 }, // Level 18
    { columns: 7, rows: 10 }, // Level 19
    { columns: 7, rows: 10 }, // Level 20
  ];

  if (level <= progression.length) {
    return progression[level - 1];
  }

  return { columns: 7, rows: 10 };
}
