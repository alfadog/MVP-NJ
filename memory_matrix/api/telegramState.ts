export type MessageBinding =
  | { inlineMessageId: string; chatId?: undefined; messageId?: undefined }
  | { inlineMessageId?: undefined; chatId: number; messageId: number };

type TelegramRuntimeState = {
  messageBindings: Map<number, MessageBinding>;
  scoreRateLimit: Map<number, number>;
};

declare global {
  // eslint-disable-next-line no-var
  var __telegramRuntimeState: TelegramRuntimeState | undefined;
}

// TODO: swap to a persistent store (Redis) in production.
const runtimeState: TelegramRuntimeState =
  globalThis.__telegramRuntimeState ??
  (globalThis.__telegramRuntimeState = {
    messageBindings: new Map<number, MessageBinding>(),
    scoreRateLimit: new Map<number, number>(),
  });

export const messageBindings = runtimeState.messageBindings;

export const scoreRateLimit = runtimeState.scoreRateLimit;
