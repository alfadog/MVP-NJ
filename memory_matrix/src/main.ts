import './styles.css';
import { initUI } from './ui.js';
import type { TelegramBackButton, TelegramContext, TelegramHaptics, ThemeScheme } from './types.js';

function lockInteractions() {
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', preventDefault);
  document.addEventListener('gesturechange', preventDefault);
  document.addEventListener('gestureend', preventDefault);
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
  document.addEventListener('touchmove', preventDefault, { passive: false });
  document.addEventListener('contextmenu', preventDefault);
  document.addEventListener('selectstart', preventDefault);
}

async function bootstrap() {
  const telegramContext: TelegramContext = {};
  let scheme: ThemeScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  try {
    const sdk = await import('@telegram-apps/sdk');
    const webApp = (sdk as any).WebApp ?? (sdk as any).webApp ?? (window as any).Telegram?.WebApp;

    if (webApp) {
      webApp.ready?.();
      webApp.expand?.();

      const updateScheme = (next: string | undefined) => {
        if (next === 'dark' || next === 'light') {
          scheme = next;
          document.documentElement.setAttribute('data-theme', scheme);
        }
      };

      updateScheme(webApp.colorScheme);
      webApp.onEvent?.('themeChanged', () => updateScheme(webApp.colorScheme));

      const backButton = webApp.BackButton;
      if (backButton) {
        let handler: (() => void) | null = null;
        backButton.onClick?.(() => handler?.());
        telegramContext.backButton = {
          setHandler(next: () => void) {
            handler = next;
          },
          show() {
            backButton.show?.();
          },
          hide() {
            backButton.hide?.();
          },
        } satisfies TelegramBackButton;
      }

      const haptic = webApp.HapticFeedback;
      if (haptic) {
        telegramContext.haptics = {
          impact(style: 'light' | 'medium' | 'heavy') {
            haptic.impactOccurred?.(style);
          },
          notify(type: 'success' | 'error' | 'warning') {
            haptic.notificationOccurred?.(type);
          },
        } satisfies TelegramHaptics;
      }
    }
  } catch (error) {
    console.warn('Telegram SDK unavailable', error);
  }

  document.documentElement.setAttribute('data-theme', scheme);

  initUI({
    initialScheme: scheme,
    telegram: telegramContext,
  });
}

lockInteractions();
bootstrap();
