import type { ComponentType } from 'react';

import { PatternPeekGame } from './pattern-peek/PatternPeekGame';

export type GameSkillType =
  | 'MEMORY'
  | 'SPEED'
  | 'ATTENTION'
  | 'FLEXIBILITY'
  | 'MATH';

export interface GameComponentProps {
  game: GameDefinition;
  session: {
    startedAt: Date | null;
    startGame: () => void;
    finishGame: (result: {
      score: number;
      level?: number;
      durationMs?: number;
      meta?: any;
    }) => void;
  };
}

export interface GameDefinition {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  skillType: GameSkillType;
  component?: ComponentType<GameComponentProps>;
}

export const games: GameDefinition[] = [
  {
    id: 'pattern-peek',
    slug: 'pattern-peek',
    title: 'Pattern Peek',
    shortDescription: 'Remember symbol grids that disappear in seconds.',
    skillType: 'MEMORY',
    component: PatternPeekGame,
  },
  {
    id: 'turbo-tap',
    slug: 'turbo-tap',
    title: 'Turbo Tap',
    shortDescription: 'React instantly to targets before they fade.',
    skillType: 'SPEED',
  },
  {
    id: 'focus-lane',
    slug: 'focus-lane',
    title: 'Focus Lane',
    shortDescription: 'Filter distractions and lock onto the right signal.',
    skillType: 'ATTENTION',
  },
  {
    id: 'shape-shift',
    slug: 'shape-shift',
    title: 'Shape Shift',
    shortDescription: 'Adapt to new matching rules on the fly.',
    skillType: 'FLEXIBILITY',
  },
  {
    id: 'logic-link',
    slug: 'logic-link',
    title: 'Logic Link',
    shortDescription: 'Chain together clues to solve number puzzles.',
    skillType: 'MATH',
  },
  {
    id: 'memory-sprint',
    slug: 'memory-sprint',
    title: 'Memory Sprint',
    shortDescription: 'Track moving cards and recall their symbols.',
    skillType: 'MEMORY',
  },
];

export const GAME_SKILL_LABELS: Record<GameSkillType, string> = {
  MEMORY: 'Memory',
  SPEED: 'Speed',
  ATTENTION: 'Attention / Focus',
  FLEXIBILITY: 'Flexibility',
  MATH: 'Math / Logic',
};

export const GAME_SKILL_ORDER: GameSkillType[] = [
  'MEMORY',
  'SPEED',
  'ATTENTION',
  'FLEXIBILITY',
  'MATH',
];
