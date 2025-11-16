import type { LevelDefinition } from './levels';

export interface RoundFeedback {
  correct: Set<number>;
  missed: Set<number>;
  incorrect: Set<number>;
}

export interface RoundEvaluation {
  status: 'success' | 'fail';
  correct: number;
  incorrect: number;
  missed: number;
  totalTargets: number;
  accuracy: number;
  pointsAwarded: number;
  feedback: RoundFeedback;
  elapsedMs: number;
  levelId: number;
}

export function evaluateRound(
  pattern: number[],
  selection: Set<number>,
  level: LevelDefinition,
  elapsedMs: number,
): RoundEvaluation {
  const patternSet = new Set(pattern);
  const correct = pattern.filter((index) => selection.has(index));
  const missed = pattern.filter((index) => !selection.has(index));
  const incorrect = Array.from(selection).filter((index) => !patternSet.has(index));
  const totalTargets = pattern.length;
  const accuracy = totalTargets === 0 ? 0 : correct.length / totalTargets;
  const status: 'success' | 'fail' = correct.length === totalTargets && incorrect.length === 0 ? 'success' : 'fail';
  const baseScore = level.patternLength * 120;
  const penalty = incorrect.length * 30 + missed.length * 35;
  const bonusRatio = Math.max(0, Math.min(1, (level.bonusWindowMs - elapsedMs) / level.bonusWindowMs));
  const timeBonus = Math.round(bonusRatio * 45);
  const points = Math.max(0, Math.round(baseScore * accuracy + timeBonus - penalty));

  return {
    status,
    correct: correct.length,
    incorrect: incorrect.length,
    missed: missed.length,
    totalTargets,
    accuracy,
    pointsAwarded: points,
    feedback: {
      correct: new Set(correct),
      missed: new Set(missed),
      incorrect: new Set(incorrect),
    },
    elapsedMs,
    levelId: level.id,
  };
}
