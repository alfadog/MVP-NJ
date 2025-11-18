'use client';

import { useEffect } from 'react';
import {
  bindViewportCssVars,
  disableVerticalSwipes,
  enableVerticalSwipes,
  expandViewport,
  miniApp,
  useSignal,
} from '@telegram-apps/sdk-react';

const CHROME_COLOR_FALLBACK = '#f6f3ef';

function readAppBackgroundColor() {
  if (typeof window === 'undefined') {
    return CHROME_COLOR_FALLBACK;
  }

  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue('--color-app-background').trim();

  return value || CHROME_COLOR_FALLBACK;
}

/**
 * Keeps the Mini App shell in sync with Telegram's full-screen experience.
 * - Calls WebApp.ready() so the native placeholder disappears immediately.
 * - Expands to the maximum allowed height and pins the viewport CSS variables.
 * - Disables the swipe-to-collapse gesture to avoid accidental closes.
 */
export function useTelegramShell() {
  const isDark = useSignal(miniApp.isDark);

  useEffect(() => {
    // Inform Telegram that the UI is ready as soon as we mount on the client.
    miniApp.ready.ifAvailable?.();

    const syncChromeColors = () => {
      const chromeColor = readAppBackgroundColor();

      miniApp.setHeaderColor.ifAvailable?.(chromeColor);
      miniApp.setBackgroundColor.ifAvailable?.(chromeColor);
      miniApp.setBottomBarColor.ifAvailable?.(chromeColor);
    };

    syncChromeColors();

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
    disableVerticalSwipes.ifAvailable?.();

    return () => {
      if (cssVarsBound) {
        stopBinding?.();
      }

      // Re-enable the default gesture if the component ever unmounts (e.g. HMR).
      enableVerticalSwipes.ifAvailable?.();
    };
  }, [isDark]);
}
