import type { NormalizedInputEvent } from '@/core/input';

export type ThemeScheme = 'light' | 'dark';

export interface GameState {
  level: number;
  score: number;
  random: () => number;
  mistakes: number;
}

export interface LevelState {
  level: number;
  columns: number;
  rows: number;
  total: number;
  targets: Set<number>;
  picked: Set<number>;
  wrong: Set<number>;
}

export interface TelegramBackButton {
  setHandler(handler: () => void): void;
  show(): void;
  hide(): void;
}

export interface TelegramHaptics {
  impact(style: 'light' | 'medium' | 'heavy'): void;
  notify(type: 'success' | 'error' | 'warning'): void;
}

export interface TelegramContext {
  backButton?: TelegramBackButton;
  haptics?: TelegramHaptics;
}

export interface GameResultPayload {
  score: number;
  level: number;
  durationMs: number;
}

export interface UIOptions {
  container: HTMLElement;
  hostElement: HTMLElement;
  initialScheme: ThemeScheme;
  telegram?: TelegramContext;
  onStartGame?: () => void;
  onFinishGame?: (result: GameResultPayload) => void;
  onExit?: () => void;
  bindInputHandlers?: (handlers: GameInputHandlers) => (() => void) | void;
}

export interface GameInputHandlers {
  onTap?: (event: NormalizedInputEvent) => void;
}
