import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  }

  try {
    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const response = sessions.map((session) => ({
      id: session.id,
      gameId: session.gameId,
      skillType: session.skillType,
      score: session.score,
      level: session.level,
      durationMs: session.durationMs,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to load recent sessions', error);
    return NextResponse.json({ success: false, error: 'Failed to load sessions' }, { status: 500 });
  }
}
