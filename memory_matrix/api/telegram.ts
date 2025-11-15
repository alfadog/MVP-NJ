import crypto from 'node:crypto';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram API calls will fail.');
}

const API_BASE = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : '';

type TelegramApiResponse<T> = { ok: true; result: T } | { ok: false; description?: string };

export async function callTelegramMethod<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, description: 'Missing TELEGRAM_BOT_TOKEN' } as TelegramApiResponse<T>;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`Telegram API ${method} request failed`, error);
    return { ok: false, description: 'Network error contacting Telegram' } as TelegramApiResponse<T>;
  }

  let data: TelegramApiResponse<T>;
  try {
    data = (await response.json()) as TelegramApiResponse<T>;
  } catch (error) {
    console.warn(`Telegram API ${method} returned non-JSON response`, error);
    return { ok: false, description: 'Invalid Telegram response' } as TelegramApiResponse<T>;
  }
  if (!data.ok) {
    console.warn(`Telegram API ${method} failed`, data);
  }
  return data;
}

export function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}
