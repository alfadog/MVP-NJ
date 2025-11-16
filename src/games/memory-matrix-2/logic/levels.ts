export interface LevelDefinition {
  id: number;
  gridSize: number;
  patternLength: number;
  previewDuration: number;
  recallDuration: number;
  bonusWindowMs: number;
}

export const memoryMatrixLevels: LevelDefinition[] = [
  { id: 1, gridSize: 3, patternLength: 3, previewDuration: 2200, recallDuration: 8000, bonusWindowMs: 4200 },
  { id: 2, gridSize: 3, patternLength: 4, previewDuration: 2100, recallDuration: 9000, bonusWindowMs: 4400 },
  { id: 3, gridSize: 4, patternLength: 4, previewDuration: 2200, recallDuration: 10000, bonusWindowMs: 5200 },
  { id: 4, gridSize: 4, patternLength: 5, previewDuration: 2100, recallDuration: 11000, bonusWindowMs: 5400 },
  { id: 5, gridSize: 5, patternLength: 6, previewDuration: 2100, recallDuration: 12000, bonusWindowMs: 5800 },
  { id: 6, gridSize: 5, patternLength: 7, previewDuration: 1900, recallDuration: 13000, bonusWindowMs: 6000 },
];

export const MAX_LIVES = 3;
