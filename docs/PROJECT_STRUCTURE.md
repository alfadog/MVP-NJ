# Project structure & UI guidelines

This document describes how the cognitive-training platform is organized and how
future features must be implemented. It is the single source of truth for
folder usage, routing conventions, and the UI system.

## Technology overview

- **Framework**: Next.js (App Router) with TypeScript in strict mode.
- **UI library**: [`@telegram-apps/telegram-ui`](https://github.com/telegram-mini-apps-dev/TelegramUI).
  No other design system (Tailwind, Material UI, Chakra, etc.) is allowed.
- **Design reference**: [Telegram Mini Apps UI Kit on Figma](https://www.figma.com/community/file/1348989725141777736/telegram-mini-apps-ui-kit).
  Spacing, typography scales, button states, and list layouts must match the kit.
- **Formatting & linting**: `pnpm lint` (ESLint) and `pnpm format` (Prettier).

## Directory layout

```
src/
├── app/                     # Next.js routes, layouts, and API handlers
│   ├── layout.tsx           # Root layout wires providers and TelegramUI AppRoot
│   ├── page.tsx             # Landing page that previews TelegramUI components
│   ├── init-data/           # Template diagnostic routes (keep for reference)
│   ├── launch-params/
│   ├── theme-params/
│   ├── ton-connect/
│   ├── games/               # (future) games catalog entry point
│   │   └── [slug]/          # (future) dynamic game loader
│   ├── profile/             # (future) cognitive skills dashboard
│   └── leaderboards/        # (future) rankings surface
├── components/              # Reusable React components built with TelegramUI only
│   ├── Root/                # AppRoot, TonConnect, and global error boundary
│   ├── Page.tsx             # Handles Telegram back button for every screen
│   ├── Link/, LocaleSwitcher/, etc.
├── core/                    # Telegram Mini App initialization & i18n providers
│   ├── init.ts              # Mounts SDK utilities and binds theme/viewport CSS vars
│   └── i18n/                # Internationalization setup + provider used in layout
├── hooks/                   # Shared React hooks (e.g., `useDidMount`)
├── css/                     # Utility helpers for composing class names
├── games/                   # (future) source of individual game logic modules
│   ├── <gameName>/          # Each game encapsulates hooks, components, and assets
│   └── config.ts            # Registry that maps slugs to metadata and loader fns
├── lib/                     # (future) non-React utilities (analytics, data helpers)
├── shared/                  # (future) constants, types, and models used across features
├── instrumentation-client.ts# tma.js instrumentation entry point
└── mockEnv.ts               # Telegram env mocks for local development
```

## Routing roadmap

- `/games` – interactive catalog for all training modules.
- `/games/[slug]` – runtime shell that loads a specific game from `src/games` via
  the registry in `src/games/config.ts`.
- `/profile` – summary of completed exercises, streaks, and skill levels.
- `/leaderboards` – upcoming ranking view that will share leaderboard widgets across games.
- `/app/api/*` – server actions / API routes powering storage, leaderboards, or personalization.

Each new route lives under `src/app/<route>` and must render TelegramUI sections,
cards, and lists instead of custom DOM structures.

## Telegram-specific providers & hooks

- `src/components/Root/Root.tsx` renders `<AppRoot>` from TelegramUI with the
  current theme (`miniApp.isDark`) and platform adaptivity derived from launch
  parameters. This file is also where Ton Connect is configured and where we
  wrap the entire tree in an error boundary.
- `src/core/init.ts` mounts SDK integrations (back button, viewport, theme
  bindings) and must be updated whenever Telegram releases new capabilities.
- Hooks such as `useDidMount` (in `src/hooks`) gate rendering until Telegram SDK
  hydration is complete, ensuring smooth behavior inside the Mini App runtime.

## UI & design rules

1. **Always use TelegramUI components**: lists, cells, buttons, cards, modals,
   chips, etc. Direct HTML should only wrap TelegramUI primitives.
2. **Spacing & typography**: follow the values documented in the Figma UI Kit.
   Default TelegramUI paddings already match, but any custom spacing must stick
   to the 4px/8px rhythm outlined in the kit.
3. **Light & dark modes**: do not hardcode colors. Read theme values from
   `miniApp` signals and rely on the CSS variables that `bindThemeParamsCssVars`
   exposes.
4. **Layouts & adaptivity**: App screens should stay within Telegram's safe area.
   Use `List`, `Section`, `Card`, and `Spacing` components to respect built-in
   paddings on both mobile and desktop Telegram clients.

## Adding new UI components

1. Build the component under `src/components/<ComponentName>/` and export a
   React component that composes TelegramUI primitives.
2. Reference the Figma UI Kit while designing spacing, typography, and states.
3. Keep logic (hooks, helpers) next to the component or inside `src/lib`/`src/shared`
   for cross-cutting concerns.
4. Write story-like usage notes inside the component directory to capture the
   intended props and variations.

## Game modules & registry

- Every game lives in `src/games/<gameName>/` and can expose hooks, reducers,
  and TelegramUI-based UI fragments.
- `src/games/config.ts` will export a typed registry, e.g.

  ```ts
  export const games = [
    {
      slug: 'memory-match',
      title: 'Memory Match',
      component: () => import('./memory-match').then((m) => m.MemoryMatchGame),
      difficulty: ['focus', 'memory'],
    },
  ];
  ```

- `/games/[slug]` consumes the registry to dynamically render the requested game
  and ensures telemetry/analytics hooks are attached consistently.

- `src/games/useGameSession.ts` exposes a lightweight client-only hook for
  starting/finishing a session. Games should call it to log timings/scores until
  the real analytics pipeline is connected.

## Development workflow

| Task | Command |
| ---- | ------- |
| Install deps | `pnpm install` |
| Run dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |

> **Tip**: run `pnpm dev:https` when testing inside real Telegram clients that
> require HTTPS origins.

