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
  onExit: () => void;
}

export interface GameHighScoreStat {
  label: string;
  value: string;
}

export interface GameDefinition {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  skillType: GameSkillType;
  component?: ComponentType<GameComponentProps>;
  icon: string;
  accentColor: string;
  heroBackground: string;
  heroHighlight: string;
  heroDescription: string;
  lpiLabel: string;
  lpiDescription: string;
  badgeTitle: string;
  badgeDescription: string;
  badgeIcons: string[];
  progressLabel: string;
  progressValue: number; // 0..1
  progressTarget: string;
  highScoreStats: GameHighScoreStat[];
  howToPlay: string;
}

export const games: GameDefinition[] = [
  {
    id: 'pattern-peek',
    slug: 'pattern-peek',
    title: 'Pattern Peek',
    shortDescription: 'Remember symbol grids that disappear in seconds.',
    skillType: 'MEMORY',
    component: PatternPeekGame,
    icon: '🧩',
    accentColor: '#4B6BFB',
    heroBackground: '#E7EDFF',
    heroHighlight: 'Memory',
    heroDescription: 'spotting the highlighted tiles before they vanish.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'Unlock deeper levels of brain training.',
    badgeTitle: 'Brainiac Badge',
    badgeDescription: 'Score 90+ accuracy to fill each gem.',
    badgeIcons: ['🔷', '🔶', '🟢', '⭐️'],
    progressLabel: 'Achieve in 1 play',
    progressValue: 0.85,
    progressTarget: '14/15',
    highScoreStats: [
      { label: 'Points', value: '16690' },
      { label: 'Rounds', value: '36' },
    ],
    howToPlay: 'Memorize the flashing tiles, then recreate the pattern without mistakes.',
  },
  {
    id: 'turbo-tap',
    slug: 'turbo-tap',
    title: 'Turbo Tap',
    shortDescription: 'React instantly to targets before they fade.',
    skillType: 'SPEED',
    icon: '⚡️',
    accentColor: '#FF8A5C',
    heroBackground: '#FFE8D9',
    heroHighlight: 'Speed',
    heroDescription: 'reacting to targets the moment they appear.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'See how quickly you can ramp up response time.',
    badgeTitle: 'Swift Badge',
    badgeDescription: 'Chain 3 perfect rounds to unlock.',
    badgeIcons: ['⚡️', '🚀', '⭐️'],
    progressLabel: 'On track for perfect',
    progressValue: 0.6,
    progressTarget: '9/15',
    highScoreStats: [
      { label: 'Targets', value: '48' },
      { label: 'Streak', value: '12' },
    ],
    howToPlay: 'Tap highlighted targets before they fade to keep your streak alive.',
  },
  {
    id: 'focus-lane',
    slug: 'focus-lane',
    title: 'Focus Lane',
    shortDescription: 'Filter distractions and lock onto the right signal.',
    skillType: 'ATTENTION',
    icon: '🎯',
    accentColor: '#4DC27D',
    heroBackground: '#E6F6ED',
    heroHighlight: 'Attention',
    heroDescription: 'blocking out noise to react to the correct cue.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'Stay dialed-in to improve selective focus.',
    badgeTitle: 'Focus Badge',
    badgeDescription: 'Stay distraction-free for an entire run.',
    badgeIcons: ['🎯', '🧠', '💡'],
    progressLabel: 'Dialed in',
    progressValue: 0.5,
    progressTarget: '8/16',
    highScoreStats: [
      { label: 'Signals', value: '72' },
      { label: 'Combo', value: '18' },
    ],
    howToPlay: 'Respond only to the signal that matches the prompt, ignore everything else.',
  },
  {
    id: 'shape-shift',
    slug: 'shape-shift',
    title: 'Shape Shift',
    shortDescription: 'Adapt to new matching rules on the fly.',
    skillType: 'FLEXIBILITY',
    icon: '🌀',
    accentColor: '#B987FF',
    heroBackground: '#F4EDFF',
    heroHighlight: 'Flexibility',
    heroDescription: 'switching rules mid-stream without missing a beat.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'Practice adapting to every rule change.',
    badgeTitle: 'Flex Badge',
    badgeDescription: 'Complete three rule swaps in a row.',
    badgeIcons: ['🌀', '🔁', '⭐️'],
    progressLabel: 'Next badge in',
    progressValue: 0.3,
    progressTarget: '5/15',
    highScoreStats: [
      { label: 'Rounds', value: '24' },
      { label: 'Swaps', value: '9' },
    ],
    howToPlay: 'Match based on the active rule, then pivot instantly when it changes.',
  },
  {
    id: 'logic-link',
    slug: 'logic-link',
    title: 'Logic Link',
    shortDescription: 'Chain together clues to solve number puzzles.',
    skillType: 'MATH',
    icon: '🧮',
    accentColor: '#F6C343',
    heroBackground: '#FFF4D4',
    heroHighlight: 'Problem Solving',
    heroDescription: 'linking clues to uncover the right answer.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'Calibrate your reasoning precision.',
    badgeTitle: 'Analyst Badge',
    badgeDescription: 'Solve five puzzles in a row.',
    badgeIcons: ['🧮', '🔗', '⭐️'],
    progressLabel: 'Puzzle streak',
    progressValue: 0.4,
    progressTarget: '6/15',
    highScoreStats: [
      { label: 'Score', value: '12840' },
      { label: 'Puzzles', value: '22' },
    ],
    howToPlay: 'Use the clues to determine the only pattern that satisfies every rule.',
  },
  {
    id: 'memory-sprint',
    slug: 'memory-sprint',
    title: 'Memory Sprint',
    shortDescription: 'Track moving cards and recall their symbols.',
    skillType: 'MEMORY',
    icon: '🃏',
    accentColor: '#50B8FF',
    heroBackground: '#E0F4FF',
    heroHighlight: 'Memory',
    heroDescription: 'tracking shuffled cards before revealing the match.',
    lpiLabel: 'GAME LPI',
    lpiDescription: 'Lift your short-term recall ceiling.',
    badgeTitle: 'Recall Badge',
    badgeDescription: 'Finish three perfect rounds.',
    badgeIcons: ['🃏', '💠', '⭐️'],
    progressLabel: 'Perfect run',
    progressValue: 0.7,
    progressTarget: '11/16',
    highScoreStats: [
      { label: 'Matches', value: '58' },
      { label: 'Streak', value: '14' },
    ],
    howToPlay: 'Follow the cards as they move, then reveal matching pairs from memory.',
  },
];

export const GAME_SKILL_LABELS: Record<GameSkillType, string> = {
  MEMORY: 'Memory',
  SPEED: 'Speed',
  ATTENTION: 'Attention / Focus',
  FLEXIBILITY: 'Flexibility',
  MATH: 'Math / Logic',
};

export const GAME_SKILL_DESCRIPTIONS: Record<GameSkillType, string> = {
  MEMORY: 'Exercises that boost recall and working memory.',
  SPEED: 'Quick reactions and processing challenges.',
  ATTENTION: 'Focus drills that cut through distractions.',
  FLEXIBILITY: 'Context switches and rule changes to adapt fast.',
  MATH: 'Logic and number puzzles to sharpen reasoning.',
};

export const GAME_SKILL_ORDER: GameSkillType[] = [
  'MEMORY',
  'SPEED',
  'ATTENTION',
  'FLEXIBILITY',
  'MATH',
];

export const todaysGameIds: string[] = ['pattern-peek', 'turbo-tap', 'focus-lane', 'memory-sprint'];
