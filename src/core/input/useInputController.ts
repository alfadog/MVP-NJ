import { useEffect, useMemo, useRef } from 'react';

import type {
  InputCallbacks,
  InputOptions,
  InputType,
  NormalizedInputEvent,
  SwipeDirection,
  UseInputControllerResult,
} from './types';

const DEFAULT_OPTIONS: Required<InputOptions> = {
  enableTaps: true,
  enableSwipes: false,
  maxTapDurationMs: 200,
  maxTapMovePx: 10,
  swipeMinDistancePx: 40,
  swipeAngleToleranceDeg: 35,
};

interface PointerSession {
  pointerId: number;
  startTime: number;
  startClientX: number;
  startClientY: number;
  lastClientX: number;
  lastClientY: number;
  maxDistance: number;
  movedBeyondTap: boolean;
  longPressTimer: number | null;
  longPressFired: boolean;
  lastEvent: PointerEvent;
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useInputController(
  options?: InputOptions,
  callbacks?: InputCallbacks
): UseInputControllerResult {
  const mergedOptions = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const optionsRef = useLatestRef(mergedOptions);
  const callbacksRef = useLatestRef(callbacks ?? {});
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    const sessions = new Map<number, PointerSession>();

    const cleanupSession = (pointerId: number) => {
      const session = sessions.get(pointerId);
      if (!session) {
        return;
      }
      if (session.longPressTimer !== null) {
        window.clearTimeout(session.longPressTimer);
      }
      sessions.delete(pointerId);
    };

    const createNormalizedEvent = (
      type: InputType,
      event: PointerEvent,
      session?: PointerSession,
      direction?: SwipeDirection
    ): NormalizedInputEvent => {
      const rect = element.getBoundingClientRect();
      return {
        type,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        direction,
        timestamp: event.timeStamp,
        startedAt: session?.startTime,
        durationMs: session ? event.timeStamp - session.startTime : undefined,
        pointerId: event.pointerId,
        rawEvent: event,
      };
    };

    const detectSwipeDirection = (
      dx: number,
      dy: number,
      tolerance: number
    ): SwipeDirection | null => {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const normalized = (angle + 360) % 360;
      const candidates: { direction: SwipeDirection; angle: number }[] = [
        { direction: 'right', angle: 0 },
        { direction: 'down', angle: 90 },
        { direction: 'left', angle: 180 },
        { direction: 'up', angle: 270 },
      ];

      for (const candidate of candidates) {
        const diff = Math.min(
          Math.abs(normalized - candidate.angle),
          360 - Math.abs(normalized - candidate.angle)
        );
        if (diff <= tolerance) {
          return candidate.direction;
        }
      }
      return null;
    };

    const armLongPress = (session: PointerSession) => {
      const { onLongPress } = callbacksRef.current;
      if (!onLongPress) {
        return;
      }
      if (session.longPressTimer !== null) {
        window.clearTimeout(session.longPressTimer);
      }
      session.longPressTimer = window.setTimeout(() => {
        session.longPressFired = true;
        onLongPress(createNormalizedEvent('longPress', session.lastEvent, session));
      }, optionsRef.current.maxTapDurationMs);
    };

    const cancelLongPress = (session: PointerSession | undefined) => {
      if (!session) {
        return;
      }
      if (session.longPressTimer !== null) {
        window.clearTimeout(session.longPressTimer);
        session.longPressTimer = null;
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const callbacks = callbacksRef.current;
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const now = event.timeStamp;
      const session: PointerSession = {
        pointerId: event.pointerId,
        startTime: now,
        startClientX: event.clientX,
        startClientY: event.clientY,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        maxDistance: 0,
        movedBeyondTap: false,
        longPressTimer: null,
        longPressFired: false,
        lastEvent: event,
      };

      sessions.set(event.pointerId, session);

      try {
        element.setPointerCapture?.(event.pointerId);
      } catch {
        // ignore pointer capture issues
      }

      if (callbacks.onLongPress) {
        armLongPress(session);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const session = sessions.get(event.pointerId);
      if (!session) {
        return;
      }

      session.lastEvent = event;
      session.lastClientX = event.clientX;
      session.lastClientY = event.clientY;

      const dx = event.clientX - session.startClientX;
      const dy = event.clientY - session.startClientY;
      const distance = Math.hypot(dx, dy);
      session.maxDistance = Math.max(session.maxDistance, distance);

      if (
        !session.movedBeyondTap &&
        session.maxDistance > optionsRef.current.maxTapMovePx
      ) {
        session.movedBeyondTap = true;
        cancelLongPress(session);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const opts = optionsRef.current;
      const callbacks = callbacksRef.current;
      const session = sessions.get(event.pointerId);
      if (!session) {
        return;
      }

      cancelLongPress(session);
      try {
        element.releasePointerCapture?.(event.pointerId);
      } catch {
        // ignore release errors
      }

      const duration = event.timeStamp - session.startTime;
      const dx = event.clientX - session.startClientX;
      const dy = event.clientY - session.startClientY;
      const distance = Math.hypot(dx, dy);

      const allowTap =
        opts.enableTaps &&
        !session.longPressFired &&
        duration <= opts.maxTapDurationMs &&
        distance <= opts.maxTapMovePx;

      if (allowTap && callbacks.onTap) {
        callbacks.onTap(createNormalizedEvent('tap', event, session));
        cleanupSession(event.pointerId);
        return;
      }

      const allowSwipe =
        opts.enableSwipes &&
        !session.longPressFired &&
        distance >= opts.swipeMinDistancePx;

      if (allowSwipe && callbacks.onSwipe) {
        const direction = detectSwipeDirection(
          dx,
          dy,
          opts.swipeAngleToleranceDeg
        );
        if (direction) {
          callbacks.onSwipe(createNormalizedEvent('swipe', event, session, direction));
          cleanupSession(event.pointerId);
          return;
        }
      }

      cleanupSession(event.pointerId);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      const session = sessions.get(event.pointerId);
      if (!session) {
        return;
      }
      cancelLongPress(session);
      try {
        element.releasePointerCapture?.(event.pointerId);
      } catch {
        // ignore
      }
      cleanupSession(event.pointerId);
    };

    element.addEventListener('pointerdown', handlePointerDown, { passive: true });
    element.addEventListener('pointermove', handlePointerMove, { passive: true });
    element.addEventListener('pointerup', handlePointerUp, { passive: true });
    element.addEventListener('pointercancel', handlePointerCancel, { passive: true });

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerCancel);
      sessions.forEach((session) => {
        if (session.longPressTimer !== null) {
          window.clearTimeout(session.longPressTimer);
        }
      });
      sessions.clear();
    };
  }, [callbacksRef, elementRef, optionsRef]);

  return { ref: elementRef };
}
