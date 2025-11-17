'use client';

import { useEffect } from 'react';
import {
  bindViewportCssVars,
  disableVerticalSwipes,
  enableVerticalSwipes,
  expandViewport,
  miniApp,
} from '@telegram-apps/sdk-react';

/**
 * Keeps the Mini App shell in sync with Telegram's full-screen experience.
 * - Calls WebApp.ready() so the native placeholder disappears immediately.
 * - Expands to the maximum allowed height and pins the viewport CSS variables.
 * - Disables the swipe-to-collapse gesture to avoid accidental closes.
 */
export function useTelegramShell() {
  useEffect(() => {
    // Inform Telegram that the UI is ready as soon as we mount on the client.
    miniApp.ready.ifAvailable?.();
    miniApp.setHeaderColor.ifAvailable?.('secondary_bg_color');
    miniApp.setBackgroundColor.ifAvailable?.('secondary_bg_color');

    // Request the maximum height and expose --tg-viewport-* CSS variables.
    expandViewport.ifAvailable?.();
    const [cssVarsBound, stopBinding] = bindViewportCssVars.ifAvailable
      ? bindViewportCssVars.ifAvailable()
      : [false];

    // Prevent the sheet-style swipe from collapsing the Mini App back down.
    disableVerticalSwipes.ifAvailable?.();

    return () => {
      if (cssVarsBound) {
        stopBinding?.();
      }

      // Re-enable the default gesture if the component ever unmounts (e.g. HMR).
      enableVerticalSwipes.ifAvailable?.();
    };
  }, []);
}
