# Games

## Input system

All interactive games share the same touch layer to keep tap precision consistent across Telegram Mini Apps. Wrap each game surface in the reusable [`<InputSurface>`](../components/input/InputSurface.tsx) component and connect its callbacks to your gameplay logic.

- Enable taps by default (`options={{ enableTaps: true }}`) and opt into swipes with `options.enableSwipes = true` when your game cares about gestures.
- Prefer the `onTap`, `onSwipe`, and `onLongPress` callbacks over raw `onClick`/`onTouchStart` handlers. They provide normalized coordinates and de-duplicated pointer events.
- Memory Matrix shows how to bridge the shared controller into non-React UI by passing the normalized events into the game logic. Follow the same approach for future immersive games.

This shared layer prevents ghost taps, keeps multi-touch stable, and makes it easier to roll out new gesture types consistently across the catalog.
