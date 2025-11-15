import crypto from 'node:crypto';
import { safeCompare } from './telegram.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';

export interface VerifiedInitData {
  params: URLSearchParams;
  user: { id: number; [key: string]: unknown };
  dataCheckString: string;
}

export function verifyInitData(initData: string): VerifiedInitData {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  if (!initData) {
    throw new Error('Missing initData');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('initData is missing hash');
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') {
      return;
    }
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (!safeCompare(computedHash, hash)) {
    throw new Error('Invalid initData hash');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('initData missing user payload');
  }

  let user: { id: number; [key: string]: unknown };
  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    throw new Error('Failed to parse initData user payload');
  }

  const userId = Number(user?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user id in initData');
  }

  return {
    params,
    user: { ...user, id: userId },
    dataCheckString,
  };
}
