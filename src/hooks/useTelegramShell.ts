'use client';

import { useEffect } from 'react';
import {
  bindViewportCssVars,
  disableVerticalSwipes,
  enableVerticalSwipes,
  expandViewport,
  miniApp,
  useLaunchParams,
} from '@telegram-apps/sdk-react';

/**
 * Keeps the Mini App shell in sync with Telegram's full-screen experience.
 * - Calls WebApp.ready() so the native placeholder disappears immediately.
 * - Expands to the maximum allowed height and pins the viewport CSS variables.
 * - Disables the swipe-to-collapse gesture to avoid accidental closes.
 * - Ensures fullscreen mode on iOS with proper viewport configuration.
 */
export function useTelegramShell() {
  const launchParams = useLaunchParams();
  const isIOS = ['macos', 'ios'].includes(launchParams.tgWebAppPlatform);

  useEffect(() => {
    // Access native Telegram WebApp API for fullscreen and swipe behavior
    // According to https://docs.telegram-mini-apps.com/
    // Methods: web_app_request_fullscreen, web_app_setup_swipe_behavior
    if (typeof window !== 'undefined') {
      const tgWebApp = (window as any).Telegram?.WebApp;
      if (tgWebApp) {
        // Inform Telegram that the UI is ready - must be called first
        tgWebApp.ready?.();

        // 1. Expand to maximum height first
        tgWebApp.expand?.();

        // 2. Request fullscreen mode - removes Telegram header and footer
        // https://docs.telegram-mini-apps.com/platform/viewport
        // Method: web_app_request_fullscreen
        if (tgWebApp.requestFullscreen) {
          tgWebApp.requestFullscreen();
        }

        // 3. Setup swipe behavior to disable vertical swipes inside the app
        // https://docs.telegram-mini-apps.com/platform/swipe-behavior
        // Method: web_app_setup_swipe_behavior with { allow_vertical_swipe: false }
        if (tgWebApp.setupSwipeBehavior) {
          // Disable vertical swipes to prevent accidental collapse
          tgWebApp.setupSwipeBehavior({
            allow_vertical_swipe: false,
          });
        }
      }
    }

    // Also use SDK methods as additional configuration
    miniApp.ready.ifAvailable?.();
    
    // Set header and background colors to match theme
    miniApp.setHeaderColor.ifAvailable?.('secondary_bg_color');
    miniApp.setBackgroundColor.ifAvailable?.('secondary_bg_color');

    // Request the maximum height and expose --tg-viewport-* CSS variables.
    // This is critical for fullscreen mode on iOS.
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

    // Also use SDK method as fallback for disabling vertical swipes
    // This is essential for iOS fullscreen behavior.
    disableVerticalSwipes.ifAvailable?.();

    return () => {
      if (cssVarsBound) {
        stopBinding?.();
      }

      // Re-enable the default gesture if the component ever unmounts (e.g. HMR).
      enableVerticalSwipes.ifAvailable?.();
    };
  }, [isIOS]);
}
