# Memory Matrix Telegram Mini App

An ultra-light HTML5 remake of Lumosity's Memory Matrix built with Vite + TypeScript and optimized for Telegram Mini Apps. The game now plugs into Telegram's Game platform so scores submitted from the in-app "Play Game" button propagate to the chat leaderboard via the Bot API.

## Features

- ⚡ Instant-loading Vite + TypeScript bundle without heavyweight frameworks.
- 🧠 Infinite levels with progressively harder patterns.
- 💾 Local history stored in `localStorage` for offline play.
- 🤖 Telegram webhook + score API for chat leaderboards (`/api/webhook`, `/api/score`).
- 📳 Optional Telegram haptics and Back Button integration when run inside the Mini App container.

## Environment Variables

Create a `.env` (or configure Vercel project variables) using the template below:

```env
TELEGRAM_BOT_TOKEN=123456:telegram-bot-token
GAME_SHORT_NAME=memory_matrix
APP_HMAC_SECRET=optional-shared-secret
PUBLIC_GAME_URL=https://<your-vercel-domain>
```

- `TELEGRAM_BOT_TOKEN` – token from [@BotFather](https://t.me/BotFather).
- `GAME_SHORT_NAME` – the short name you register for the game (must match BotFather configuration).
- `APP_HMAC_SECRET` – optional secret used to sign client payloads; leave blank to skip extra signing.
- `PUBLIC_GAME_URL` – public HTTPS URL of the deployed game; used by `answerCallbackQuery` to open the app when tapping **Play**.

## Development

```bash
npm install
npm run dev
```

The Vite dev server runs the front-end on `http://localhost:5173`. To exercise the serverless endpoints locally you can use `vercel dev` or send direct HTTP requests to a deployed preview (`/api/webhook`, `/api/score`).

For a production build:

```bash
npm run build
npm run preview
```

## Telegram Bot & Game Setup

1. Open [@BotFather](https://t.me/BotFather) and run `/newbot` to create a bot. Copy the token into `TELEGRAM_BOT_TOKEN`.
2. Run `/newgame` to register the game, set **Game Short Name** to `memory_matrix` (or another value that matches `GAME_SHORT_NAME`).
3. Set the **Game URL** to your deployed Vercel project (e.g. `https://tg-games-swart.vercel.app`).
4. (Optional) Provide an image and description for the game listing.

## Webhook Configuration

Deploy the project to Vercel, then point Telegram to the webhook endpoint:

```bash
curl -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d url=https://<your-vercel-domain>/api/webhook
```

The `/api/webhook` handler responds to `/start` by sending the game, and records callback query metadata (inline message ID or chat + message ID) required for score updates.

## Score Submission Flow

The `/api/score` endpoint accepts POSTed scores from the game client:

```json
{
  "score": 5120,
  "level": 9,
  "duration_ms": 84000,
  "initData": "tgWebAppInitData"
}
```

Server-side steps:

1. Validate `initData` by recomputing the HMAC with `TELEGRAM_BOT_TOKEN`.
2. Ensure the player tapped the blue **Play Game** button so a message binding exists.
3. Rate-limit to one submission per second and clamp score/duration ranges.
4. Call `setGameScore` (and `getGameHighScores`) on the Bot API to update the chat message.

If successful the response contains the best known score plus an optional leaderboard snippet that the client displays in the game-over screen.

## Testing the Flow

1. DM your bot on Telegram and send `/start`.
2. Tap the **Play Game** button to open the Mini App. The callback query will bind your chat/message for score updates.
3. Play a round. On game over the client posts to `/api/score` with `Telegram.WebApp.initData`.
4. A successful submission updates the inline leaderboard popup inside Telegram. The game UI also surfaces the global best and your rank.

## Project Structure

```
tg-memory-matrix/
├─ api/
│  ├─ score.ts       # Score submission + Bot API calls
│  └─ webhook.ts     # Telegram webhook handler (/start, callback queries)
├─ public/
│  ├─ favicon.svg
│  └─ index.html
├─ src/
│  ├─ game.ts       # Core game logic and progression
│  ├─ main.ts       # Telegram integration and bootstrapping
│  ├─ storage.ts    # localStorage helpers
│  ├─ styles.css    # Minimal theming and layout
│  ├─ types.ts      # Shared interfaces
│  └─ ui.ts         # DOM rendering and interactions + score submission
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## License

MIT
