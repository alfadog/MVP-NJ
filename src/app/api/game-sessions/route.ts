import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

interface GameSessionPayload {
  user?: {
    id?: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  gameId?: string;
  skillType?: string;
  score?: number;
  level?: number;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
  meta?: unknown;
}

function invalid(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let payload: GameSessionPayload;

  try {
    payload = await request.json();
  } catch (error) {
    return invalid('Invalid JSON payload');
  }

  const userId = payload.user?.id?.toString();
  if (!userId) {
    return invalid('Missing user.id');
  }

  if (!payload.gameId) {
    return invalid('Missing gameId');
  }

  if (!payload.skillType) {
    return invalid('Missing skillType');
  }

  if (typeof payload.score !== 'number') {
    return invalid('Missing score');
  }

  if (!payload.startedAt || !payload.finishedAt) {
    return invalid('Missing startedAt/finishedAt');
  }

  const startedAt = new Date(payload.startedAt);
  const finishedAt = new Date(payload.finishedAt);

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
    return invalid('Invalid startedAt/finishedAt');
  }

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: payload.user?.username ?? undefined,
        firstName: payload.user?.firstName ?? undefined,
        lastName: payload.user?.lastName ?? undefined,
      },
      create: {
        id: userId,
        username: payload.user?.username ?? null,
        firstName: payload.user?.firstName ?? null,
        lastName: payload.user?.lastName ?? null,
      },
    });

    const session = await prisma.gameSession.create({
      data: {
        userId,
        gameId: payload.gameId,
        skillType: payload.skillType,
        score: payload.score,
        level: payload.level ?? null,
        durationMs: payload.durationMs ?? null,
        startedAt,
        finishedAt,
        meta: payload.meta ?? undefined,
      },
    });

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Failed to persist game session', error);
    return NextResponse.json({ success: false, error: 'Failed to save session' }, { status: 500 });
  }
}
