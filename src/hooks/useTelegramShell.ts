'use client';

import { useEffect } from 'react';
import {
  bindViewportCssVars,
  disableVerticalSwipes,
  enableVerticalSwipes,
  expandViewport,
  miniApp,
  useLaunchParams,
  useSignal,
} from '@telegram-apps/sdk-react';

import { telegramThemeConfig } from '@/core/telegram-theme-config';

/**
 * Keeps the Mini App shell in sync with Telegram's full-screen experience.
 * - Calls WebApp.ready() so the native placeholder disappears immediately.
 * - Expands to the maximum allowed height and pins the viewport CSS variables.
 * - Disables the swipe-to-collapse gesture to avoid accidental closes.
 * - Sets theme colors from central config.
 * - Ensures fullscreen mode on iOS with proper viewport configuration.
 */
export function useTelegramShell() {
  const launchParams = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);
  const isIOS = ['macos', 'ios'].includes(launchParams.tgWebAppPlatform);

  useEffect(() => {
    // Get theme colors from central config
    const theme = isDark ? telegramThemeConfig.dark : telegramThemeConfig.light;

    // Step 1: Initialize Telegram WebApp - ready() must be called first
    miniApp.ready.ifAvailable?.();

    // Step 2: Expand viewport to maximum height
    expandViewport.ifAvailable?.();

    // Step 3: Set header and background colors from config
    // Using actual color values, not theme parameter names
    miniApp.setHeaderColor.ifAvailable?.(theme.header_bg_color);
    miniApp.setBackgroundColor.ifAvailable?.(theme.bg_color);

    // Step 4: Access native Telegram WebApp API for additional configuration
    // According to https://docs.telegram-mini-apps.com/
    if (typeof window !== 'undefined') {
      const tgWebApp = (window as any).Telegram?.WebApp;
      if (tgWebApp) {
        // Ensure ready() is called on native API too
        tgWebApp.ready?.();

        // Expand to maximum height
        tgWebApp.expand?.();

        // Request fullscreen mode - removes Telegram header and footer
        // https://docs.telegram-mini-apps.com/platform/viewport
        if (tgWebApp.requestFullscreen) {
          tgWebApp.requestFullscreen();
        }

        // Setup swipe behavior to disable vertical swipes
        // https://docs.telegram-mini-apps.com/platform/swipe-behavior
        if (tgWebApp.setupSwipeBehavior) {
          tgWebApp.setupSwipeBehavior({
            allow_vertical_swipe: false,
          });
        }

        // Set theme colors on native API
        if (tgWebApp.setHeaderColor) {
          tgWebApp.setHeaderColor(theme.header_bg_color);
        }
        if (tgWebApp.setBackgroundColor) {
          tgWebApp.setBackgroundColor(theme.bg_color);
        }
      }
    }

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
  }, [isDark, isIOS]);
}
