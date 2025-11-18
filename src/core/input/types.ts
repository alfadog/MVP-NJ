import type { RefObject } from 'react';

export type InputType = 'tap' | 'swipe' | 'longPress';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface NormalizedInputEvent {
  type: InputType;
  x: number;
  y: number;
  direction?: SwipeDirection;
  timestamp: number;
  startedAt?: number;
  durationMs?: number;
  pointerId: number | string;
  rawEvent: PointerEvent | TouchEvent | MouseEvent;
}

export interface InputOptions {
  enableTaps?: boolean;
  enableSwipes?: boolean;
  maxTapDurationMs?: number;
  maxTapMovePx?: number;
  swipeMinDistancePx?: number;
  swipeAngleToleranceDeg?: number;
}

export interface InputCallbacks {
  onTap?: (event: NormalizedInputEvent) => void;
  onSwipe?: (event: NormalizedInputEvent) => void;
  onLongPress?: (event: NormalizedInputEvent) => void;
}

export interface UseInputControllerResult {
  ref: RefObject<HTMLElement>;
}
