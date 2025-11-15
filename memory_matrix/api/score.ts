import type { VercelRequest, VercelResponse } from './vercel-shim.js';
import crypto from 'node:crypto';
import { callTelegramMethod, safeCompare } from './telegram.js';
import { verifyInitData } from './telegramAuth.js';
import { messageBindings, scoreRateLimit } from './telegramState.js';

export const config = { runtime: 'nodejs' };

const APP_HMAC_SECRET = process.env.APP_HMAC_SECRET;

interface ScoreRequestBody {
  score: number;
  level?: number;
  duration_ms?: number;
  initData: string;
  signed?: string;
}

interface HighScoreUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface HighScoreEntry {
  position: number;
  score: number;
  user: HighScoreUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ accepted: false, error: 'Method Not Allowed' });
    return;
  }

  let body: ScoreRequestBody;
  try {
    body = parseBody(req.body);
  } catch (error) {
    res.status(400).json({ accepted: false, error: 'Invalid JSON body' });
    return;
  }

  const { score, level, duration_ms, initData, signed } = body;

  if (!Number.isFinite(score)) {
    res.status(400).json({ accepted: false, error: 'Score must be a number' });
    return;
  }

  if (score < 0 || score > 1_000_000) {
    res.status(400).json({ accepted: false, error: 'Score is out of range' });
    return;
  }

  if (level !== undefined && (!Number.isFinite(level) || level < 0 || level > 10_000)) {
    res.status(400).json({ accepted: false, error: 'Invalid level value' });
    return;
  }

  if (
    duration_ms !== undefined &&
    (!Number.isFinite(duration_ms) || duration_ms < 0 || duration_ms > 3_600_000)
  ) {
    res.status(400).json({ accepted: false, error: 'Invalid duration' });
    return;
  }

  let verified;
  try {
    verified = verifyInitData(initData);
  } catch (error) {
    res.status(401).json({ accepted: false, error: (error as Error).message });
    return;
  }

  const userId = verified.user.id;

  if (APP_HMAC_SECRET && signed) {
    const canonical = canonicalizePayload({ score, level, duration_ms, initData });
    const expected = crypto.createHmac('sha256', APP_HMAC_SECRET).update(canonical).digest('hex');
    if (!safeCompare(expected, signed)) {
      res.status(401).json({ accepted: false, error: 'Invalid client signature' });
      return;
    }
  }

  const binding = messageBindings.get(userId);
  if (!binding) {
    res
      .status(409)
      .json({
        accepted: false,
        error: 'Launch the game via the bot using the Play Game button to submit scores.',
      });
    return;
  }

  const now = Date.now();
  const lastSubmit = scoreRateLimit.get(userId) ?? 0;
  if (now - lastSubmit < 1000) {
    res.status(429).json({ accepted: false, error: 'Score submissions are limited to 1 per second' });
    return;
  }
  scoreRateLimit.set(userId, now);

  const payload: Record<string, unknown> = {
    user_id: userId,
    score: Math.floor(score),
    force: true,
    disable_edit_message: false,
  };

  const bindingArgs = binding.inlineMessageId
    ? { inline_message_id: binding.inlineMessageId }
    : { chat_id: binding.chatId, message_id: binding.messageId };

  if (binding.inlineMessageId) {
    payload.inline_message_id = binding.inlineMessageId;
  } else {
    payload.chat_id = binding.chatId;
    payload.message_id = binding.messageId;
  }

  try {
    const setScore = await callTelegramMethod<boolean>('setGameScore', payload);
    if (!setScore.ok) {
      res.status(502).json({ accepted: false, error: setScore.description ?? 'setGameScore failed' });
      return;
    }

    let bestScore = Math.floor(score);
    let top: HighScoreEntry[] | undefined;
    let me: HighScoreEntry | undefined;

    const highScores = await callTelegramMethod<HighScoreEntry[]>('getGameHighScores', {
      user_id: userId,
      ...bindingArgs,
    });

    if (highScores.ok) {
      const entries = highScores.result;
      bestScore = Math.max(bestScore, ...entries.map((entry) => entry.score));
      top = entries.slice(0, 10).map(sanitizeHighScore);
      me = entries.find((entry) => entry.user.id === userId);
      if (me) {
        me = sanitizeHighScore(me);
      }
    }

    res.status(200).json({
      accepted: true,
      best_score: bestScore,
      top,
      me,
    });
  } catch (error) {
    console.error('Failed to submit score', error);
    res.status(500).json({ accepted: false, error: 'Internal server error' });
  }
}

function parseBody(body: unknown): ScoreRequestBody {
  if (!body) {
    throw new Error('Empty body');
  }

  if (typeof body === 'string') {
    return JSON.parse(body) as ScoreRequestBody;
  }

  return body as ScoreRequestBody;
}

function canonicalizePayload(payload: {
  score: number;
  level?: number;
  duration_ms?: number;
  initData: string;
}): string {
  const parts: string[] = [`score=${Math.floor(payload.score)}`, `initData=${payload.initData}`];
  if (payload.level !== undefined) {
    parts.push(`level=${Math.floor(payload.level)}`);
  }
  if (payload.duration_ms !== undefined) {
    parts.push(`duration_ms=${Math.floor(payload.duration_ms)}`);
  }
  parts.sort();
  return parts.join('&');
}

function sanitizeHighScore(entry: HighScoreEntry): HighScoreEntry {
  return {
    position: entry.position,
    score: entry.score,
    user: {
      id: entry.user.id,
      first_name: entry.user.first_name,
      last_name: entry.user.last_name,
      username: entry.user.username,
    },
  };
}
