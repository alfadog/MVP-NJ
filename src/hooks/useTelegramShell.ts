'use client';

import { useEffect } from 'react';
import {
  bindViewportCssVars,
  disableVerticalSwipes,
  enableVerticalSwipes,
  expandViewport,
  miniApp,
} from '@telegram-apps/sdk-react';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
      setBottomBarColor?: (color: string) => void;
    };
  };
};

/**
 * Keeps the Mini App shell in sync with Telegram's full-screen experience.
 * - Calls WebApp.ready() so the native placeholder disappears immediately.
 * - Expands to the maximum allowed height and pins the viewport CSS variables.
 * - Disables the swipe-to-collapse gesture to avoid accidental closes.
 */
export function useTelegramShell() {
  useEffect(() => {
    const surfaceColor = '#fdfdfe';

    // Inform Telegram that the UI is ready as soon as we mount on the client.
    miniApp.ready.ifAvailable?.();
    miniApp.setHeaderColor.ifAvailable?.(surfaceColor);
    miniApp.setBackgroundColor.ifAvailable?.(surfaceColor);

    if (typeof window !== 'undefined') {
      const tg = (window as TelegramWindow).Telegram?.WebApp;
      tg?.setHeaderColor?.(surfaceColor);
      tg?.setBackgroundColor?.(surfaceColor);
      tg?.setBottomBarColor?.(surfaceColor);
    }

    // Request the maximum height and expose --tg-viewport-* CSS variables.
    expandViewport.ifAvailable?.();

    let cssVarsBound = false;
    let stopBinding: (() => void) | undefined;

    if (bindViewportCssVars.ifAvailable) {
      try {
        const [bound, stop] = bindViewportCssVars.ifAvailable();
        cssVarsBound = bound;
        stopBinding = stop;
      } catch (error) {
        const isAlreadyBoundError =
          error instanceof Error && error.message.toLowerCase().includes('css variables are already bound');

        if (!isAlreadyBoundError) {
          throw error;
        }

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console -- Useful during development to surface Telegram SDK binding issues.
          console.warn('Skipping viewport CSS variable binding because it is already active.');
        }
      }
    }

    // Prevent the sheet-style swipe from collapsing the Mini App back down.
    const canDisableSwipe = typeof disableVerticalSwipes.ifAvailable === 'function';
    let removeEdgeSwipeGuards: (() => void) | undefined;

    if (canDisableSwipe) {
      disableVerticalSwipes.ifAvailable?.();
    } else {
      // Prevent accidental sheet-like collapses on clients that do not expose the
      // official API yet by stopping downward swipes that originate from the top.
      removeEdgeSwipeGuards = (() => {
        let startY = 0;
        let shouldBlock = false;

        const onTouchStart = (event: TouchEvent) => {
          if (event.touches.length !== 1) {
            shouldBlock = false;
            return;
          }

          startY = event.touches[0].clientY;
          const scrollElement = document.scrollingElement;
          shouldBlock = (scrollElement?.scrollTop ?? 0) <= 0;
        };

        const onTouchMove = (event: TouchEvent) => {
          if (!shouldBlock || event.touches.length !== 1) {
            return;
          }

          const deltaY = event.touches[0].clientY - startY;
          if (deltaY > 8) {
            event.preventDefault();
          }
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
          document.removeEventListener('touchstart', onTouchStart);
          document.removeEventListener('touchmove', onTouchMove);
        };
      })();
    }

    return () => {
      if (cssVarsBound) {
        stopBinding?.();
      }

      // Re-enable the default gesture if the component ever unmounts (e.g. HMR).
      if (canDisableSwipe) {
        enableVerticalSwipes.ifAvailable?.();
      }

      removeEdgeSwipeGuards?.();
    };
  }, []);
}
