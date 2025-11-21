# AI Collaboration Rules (Cursor, Copilot / Codex, other LLMs)

This file defines how AI assistants should behave when working with this
repository.

The owner explicitly uses this project as a **sandbox** to test and explore the
capabilities of AI tools (Cursor, GitHub-based Codex-like systems, etc.). The
code is allowed to change, and the architecture is allowed to evolve.

At the same time, there are important safety and scope constraints.

---

## 1. Scope & isolation

- This repository is **self-contained**.  
  Do NOT assume any coupling to:
  - Magento projects,
  - other domains,
  - other repositories.

- The production Magento installation lives on a separate Canadian server.  
  **Never modify Magento code, configs, or services** unless the user
  explicitly and very clearly asks you to do so in a separate context.

- When working with servers via SSH (through Cursor or otherwise):
  - Only touch directories that the user explicitly names for this project
    (e.g. `/opt/gamenj`).
  - Do not modify Nginx configs for unrelated domains.
  - Do not stop or restart services that are clearly unrelated to this
    project (e.g. Magento, its PHP-FPM pools, its databases).

If you are not sure whether something belongs to this project, ask for
clarification before changing it.

---

## 2. Project understanding

Before making any non-trivial change, you (AI assistant) must:

1. Read `README.md`.
2. Read `docs/PROJECT_STRUCTURE.md`.
3. Re-scan the existing code under `src/`, `prisma/` and `memory_matrix/` as
   needed.

Then briefly restate in your own words:

- What the current task is.
- Which parts of the project you plan to touch.
- Whether your change is a small local fix or a larger refactor.

---

## 3. Freedom to refactor (with responsibility)

This repository is intentionally flexible:

- You are allowed to:
  - refactor components and routes,
  - reorganize folders,
  - replace or remove dependencies (UI libraries, state managers, etc.),
  - simplify the integration with Telegram Mini Apps,
  - propose new architecture for games and dashboards.

- However, you must:
  - keep the project in a **buildable** state:
    - `pnpm lint`
    - `pnpm build`
  - avoid unnecessary churn (e.g. renaming everything just for style).
  - clearly explain:
    - what you changed,
    - why it is better,
    - what trade-offs it introduces.

If you propose a large change (e.g. switching UI library, changing how games are
registered, replacing some core dependency):

1. Describe the plan.
2. Apply changes in a way that keeps the app running.
3. Update `docs/PROJECT_STRUCTURE.md` to match the new reality.

---

## 4. Dependencies & tooling

Current state (subject to change):

- Next.js App Router (Next 15).
- TypeScript.
- pnpm as package manager.
- `@telegram-apps/sdk-react` and `@telegram-apps/telegram-ui`.
- Prisma for ORM, with migrations under `prisma/migrations`.

Rules:

- Prefer **pnpm** for all commands (`pnpm install`, `pnpm dev`, etc.).
- Do not introduce multiple competing package managers (no Yarn/npmi lock files
  alongside `pnpm-lock.yaml`), unless explicitly requested.
- When adding or removing dependencies:
  - mention why,
  - check for unused imports and dead code,
  - ensure the project still builds.

---

## 5. Git & change management

When preparing changes (especially if you are acting as an agent that can
commit/push):

- Create a **separate branch** for substantial work instead of committing
  directly to `main`.
- Group related changes into small, meaningful commits.
- Avoid mixing unrelated changes (e.g. refactoring + new feature + formatting)
  in a single commit.

If you cannot run commands yourself (no direct shell access), still assume that
any changes you propose must pass:

- `pnpm lint`
- `pnpm build`

and keep that in mind when editing TypeScript, Prisma schema or Next.js
configuration.

---

## 6. Server & deployment tasks

This repository is expected to be deployed under a dedicated subdomain (e.g.
`gamenj.luxandre.com`) on a server that may also host Magento and other sites.

When asked to help with deployment, Nginx, PM2, systemd or similar:

1. Treat existing production sites (especially Magento) as **out of bounds**
   unless explicitly told otherwise.
2. Limit changes to:
   - the specific directories the user names for this project,
   - the vhost for the specific domain the user mentioned,
   - the processes directly related to this app.

3. Before editing any critical config file (Nginx, systemd units, PM2 process
   list), always:
   - show the diff or exact change you plan to apply,
   - explain what it does,
   - request confirmation.

Never run destructive commands like `rm -rf`, `drop database`, or wholesale
service removal unless the user has clearly and repeatedly asked for that
exact operation.

---

## 7. How to interact with this project as AI

When you start a new conversation/session for this repository:

1. Read `README.md`, `docs/PROJECT_STRUCTURE.md` and this file.
2. Confirm back to the user:
   - what you understood about the project,
   - what the current goal is.
3. When making suggestions:
   - be explicit about which files and directories you will change,
   - keep the user informed if you are about to apply a major refactor.

Remember: this repository is a **training ground**. It is okay to experiment,
but not at the cost of leaving the project in a broken state or impacting other
servers/projects.
