/**
 * Central configuration for Telegram Mini App theme colors
 * Based on Unicorn-style design reference
 * Colors match the app background and header design
 */

export const telegramThemeConfig = {
  // Light theme colors (default) - matching #f6f3ef background
  light: {
    bg_color: '#f6f3ef', // Main background - matches --color-app-background
    secondary_bg_color: '#ffffff', // Secondary background (header, cards)
    header_bg_color: '#ffffff', // Header background - white like Unicorn
    section_bg_color: '#f0ebe4', // Section background - matches --color-surface-muted
    text_color: '#101828', // Primary text - matches --color-text-primary
    hint_color: '#475467', // Secondary text - matches --color-text-secondary
    link_color: '#4b6bfb', // Links - matches --color-accent-memory
    button_color: '#4b6bfb', // Buttons - matches accent
    button_text_color: '#ffffff', // Button text
    accent_text_color: '#4b6bfb', // Accent text
    section_header_text_color: '#101828', // Section headers
    subtitle_text_color: '#667085', // Subtitles - matches --color-text-tertiary
    destructive_text_color: '#ef4444', // Destructive actions
  },
  // Dark theme colors
  dark: {
    bg_color: '#121012',
    secondary_bg_color: '#1a1a1c',
    header_bg_color: '#1a1a1c',
    section_bg_color: '#232326',
    text_color: '#f5f5f5',
    hint_color: '#8e8e93',
    link_color: '#4b6bfb',
    button_color: '#4b6bfb',
    button_text_color: '#ffffff',
    accent_text_color: '#4b6bfb',
    section_header_text_color: '#f5f5f5',
    subtitle_text_color: '#8e8e93',
    destructive_text_color: '#ff3b30',
  },
} as const;

export type TelegramThemeConfig = typeof telegramThemeConfig;

