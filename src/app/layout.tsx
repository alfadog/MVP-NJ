import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';

import { Root } from '@/components/Root/Root';
import { I18nProvider } from '@/core/i18n/provider';
import { telegramThemeConfig } from '@/core/telegram-theme-config';

import '@telegram-apps/telegram-ui/dist/styles.css';
import 'normalize.css/normalize.css';
import './_assets/globals.css';

// Автоматическая версия для cache busting в Telegram Mini App
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || `dev-${Date.now()}`;

// Get theme color for meta tag (using light theme as default)
const themeColor = telegramThemeConfig.light.bg_color;

export const metadata: Metadata = {
  title: 'Your Application Title Goes Here',
  description: 'Your application description goes here',
  // Добавляем версию в мета-теги для автоматического обновления кеша Telegram
  other: {
    'app-version': appVersion,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Fullscreen on iOS with safe-area support
  // Theme color for Telegram header and browser
  themeColor: themeColor,
  // Color scheme for proper rendering
  colorScheme: 'light dark',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Additional meta tags for Telegram Mini App */}
        <meta name="theme-color" content={themeColor} />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <I18nProvider>
          <Root>{children}</Root>
        </I18nProvider>
      </body>
    </html>
  );
}
