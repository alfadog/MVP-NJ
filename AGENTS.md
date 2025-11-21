# Agents.md — Project Rules for Telegram Mini Apps Game Platform

## Project Context
This repository contains a Telegram Mini Apps game platform built with:
– Next.js 15
– TypeScript
– @telegram-apps/sdk-react

Use ONLY the official Mini Apps documentation:
https://docs.telegram-mini-apps.com/

## Architecture Principles
Cursor may analyze, redesign, or optimize the architecture if improvements are meaningful.
Always propose structural changes with a diff and explanation before applying them.
Maintain consistent UX and UI across all games, using shared layouts, headers, and flow logic.

## Game Flow
Each game must follow a simple, consistent flow:
1. Start screen
2. Gameplay menu and top bar
3. Result screen

Cursor may design the optimal file/component structure for this flow.

## Code Quality
Follow modern Next.js and TypeScript best practices.
Keep code modular, readable, and maintainable.
Simplify and unify patterns across games when possible.
Avoid outdated patterns or legacy WebApp API usage.

## Mini Apps Behavior
Use the official Mini Apps SDK for:
– WebApp initialization
– theme params
– header color
– safe-area handling
– overscroll disabling
Avoid using old core.telegram.org WebApp docs unless explicitly required.

## Environment & Security
Store secrets only in env files.
Do not hardcode Telegram tokens.
Do not modify unrelated server projects or services.

## Deployment
This project runs independently on the server.
Server configuration changes (nginx, pm2, systemd) must be explicitly approved before execution.

# End of agents.md
