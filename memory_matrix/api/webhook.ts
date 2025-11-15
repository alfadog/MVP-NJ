import type { VercelRequest, VercelResponse } from './vercel-shim.js';
import { callTelegramMethod } from './telegram.js';
import { messageBindings } from './telegramState.js';

export const config = { runtime: 'nodejs' };

const GAME_SHORT_NAME = process.env.GAME_SHORT_NAME;
const PUBLIC_GAME_URL = process.env.PUBLIC_GAME_URL;

interface TelegramUpdate {
  message?: {
    message_id: number;
    text?: string;
    chat?: { id: number };
  };
  callback_query?: {
    id: string;
    from?: { id?: number };
    message?: { chat?: { id?: number }; message_id?: number };
    inline_message_id?: string;
    game_short_name?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!GAME_SHORT_NAME) {
    res.status(500).json({ ok: false, error: 'GAME_SHORT_NAME is not configured' });
    return;
  }

  const update = parseBody(req.body);
  if (!update) {
    res.status(400).json({ ok: false, error: 'Invalid update payload' });
    return;
  }

  try {
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat?.id;
      if (typeof chatId === 'number') {
        await callTelegramMethod('sendGame', {
          chat_id: chatId,
          game_short_name: GAME_SHORT_NAME,
        });
      }
    }

    const callback = update.callback_query;
    if (callback?.from?.id && callback.game_short_name === GAME_SHORT_NAME) {
      const userId = callback.from.id;
      if (callback.inline_message_id) {
        messageBindings.set(userId, { inlineMessageId: callback.inline_message_id });
      } else if (callback.message?.chat?.id && callback.message.message_id) {
        messageBindings.set(userId, {
          chatId: callback.message.chat.id,
          messageId: callback.message.message_id,
        });
      }

      const payload: Record<string, unknown> = { callback_query_id: callback.id };
      if (PUBLIC_GAME_URL) {
        payload.url = PUBLIC_GAME_URL;
      }
      await callTelegramMethod('answerCallbackQuery', payload);
    }
  } catch (error) {
    console.error('Failed to process Telegram update', error);
  }

  res.status(200).json({ ok: true });
}

function parseBody(body: unknown): TelegramUpdate | null {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as TelegramUpdate;
    } catch (error) {
      console.error('Failed to parse webhook body', error);
      return null;
    }
  }

  if (typeof body === 'object') {
    return body as TelegramUpdate;
  }

  return null;
}
