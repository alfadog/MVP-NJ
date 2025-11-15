import { afterEach, beforeAll } from 'vitest';

beforeAll(() => {
  if (!('requestAnimationFrame' in globalThis)) {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
      return setTimeout(() => cb(performance.now()), 0) as unknown as number;
    };
  }
  if (!('cancelAnimationFrame' in globalThis)) {
    globalThis.cancelAnimationFrame = (handle: number): void => {
      clearTimeout(handle);
    };
  }

  if (!('PointerEvent' in globalThis)) {
    class PolyfilledPointerEvent extends MouseEvent {
      pointerId: number;
      isPrimary: boolean;

      constructor(type: string, options: PointerEventInit = {}) {
        super(type, options);
        this.pointerId = options.pointerId ?? 1;
        this.isPrimary = options.isPrimary ?? true;
      }
    }
    // @ts-expect-error assign polyfill
    globalThis.PointerEvent = PolyfilledPointerEvent as unknown as typeof PointerEvent;
  }

  const elementPrototype = Element.prototype as Element & {
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };

  if (!elementPrototype.setPointerCapture) {
    elementPrototype.setPointerCapture = () => {};
  }
  if (!elementPrototype.releasePointerCapture) {
    elementPrototype.releasePointerCapture = () => {};
  }
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
