# MVP-NJ — Telegram Mini Apps Playground

This repository is an **experimental playground** for building a small cognitive-training platform on top of **Telegram Mini Apps**.

The goal is **not** to keep a perfect, frozen template, but to:

* experiment with different architectures,
* test what AI assistants (Cursor, GitHub Copilot / Codex) can do,
* iterate on simple games (e.g. Memory Matrix),
* eventually deploy them as a Telegram Mini App under a dedicated subdomain.

Most of the existing code was originally generated/modified by AI and may contain architectural or stylistic inconsistencies. Treat this project as a learning environment.

---

## Current stack (may evolve)

At the moment, the project uses:

* **Next.js 15** (App Router, `src/app`)
* **React 18**
* **TypeScript**
* **pnpm**
* `@telegram-apps/sdk-react`
* `@telegram-apps/telegram-ui`
* `next-intl`
* **Prisma** (`@prisma/client` + migrations)

These choices are **not strict constraints**. AI assistants are allowed to:

* propose better architecture,
* replace or remove dependencies,
* restructure pages/components,
* reorganize game logic,

as long as the project stays **buildable and runnable** and the assistant explains the trade-offs.

---

## High-level concept

The platform should eventually support:

* a **game list/dashboard**,
* individual **game pages** (starting with Memory Matrix),
* optional **profile**, **leaderboards**,
* proper Telegram Mini App integration:

  * `initData`,
  * theme adaptation,
  * viewport handling,
  * back button,
  * smooth WebView behaviour.

Everything else is flexible and can be redesigned.

---

## Local development

Prerequisites:

* Node.js **20+**
* pnpm installed globally — `npm install -g pnpm`

Install dependencies:

```
pnpm install
```

Start dev server (HTTP):

```
pnpm dev
```

Start dev server with local HTTPS (for TMA testing):

```
pnpm dev:https
```

Build for production:

```
pnpm build
```

Run production build:

```
pnpm start
```

Next.js dev server runs on port `3000` by default.

---

## Prisma & database

Prisma is used as the ORM.
The default setup uses **SQLite** for development (`.env.example`, `prisma/schema.prisma`).

Useful commands:

```
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:studio
```

Switching to MySQL/PostgreSQL is allowed later — update `DATABASE_URL` and regenerate the client.

---

## Routing & structure

The project uses the **App Router** (`src/app`).

See `docs/PROJECT_STRUCTURE.md` for a complete explanation of:

* folder structure,
* game structure,
* component layout,
* providers,
* conventions.

---

## AI assistant usage

This project is intentionally used to test AI tools (Cursor, Codex, etc.).

AI assistants should:

* read:

  * `README.md`,
  * `docs/PROJECT_STRUCTURE.md`,
  * `docs/AI_RULES.md`,
* propose improvements where beneficial,
* keep the project buildable (`pnpm lint`, `pnpm build`),
* avoid assumptions about other servers/projects,
* treat this repository as **isolated** (no relation to Magento or other codebases).

Experiments, refactors and architectural suggestions are welcome — as long as they are explained and do not leave the repository in a broken state.
