import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function deriveLabel(averageScore: number) {
  if (averageScore >= 90) {
    return 'Strong';
  }

  if (averageScore >= 70) {
    return 'Steady';
  }

  if (averageScore >= 50) {
    return 'Improving';
  }

  return 'Needs focus';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limitParam = searchParams.get('limit');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
  }

  let limit = DEFAULT_LIMIT;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  try {
    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const aggregates = new Map<
      string,
      {
        skillType: string;
        totalScore: number;
        sessionsCount: number;
        bestScore: number;
        lastScore: number | null;
      }
    >();

    sessions.forEach((session) => {
      const entry = aggregates.get(session.skillType);

      if (entry) {
        entry.totalScore += session.score;
        entry.sessionsCount += 1;
        entry.bestScore = Math.max(entry.bestScore, session.score);
      } else {
        aggregates.set(session.skillType, {
          skillType: session.skillType,
          totalScore: session.score,
          sessionsCount: 1,
          bestScore: session.score,
          lastScore: session.score,
        });
        return;
      }
    });

    const response = Array.from(aggregates.values()).map((entry) => {
      const averageScore = Math.round(entry.totalScore / entry.sessionsCount);

      return {
        skillType: entry.skillType,
        averageScore,
        bestScore: entry.bestScore,
        lastScore: entry.lastScore ?? entry.bestScore,
        sessionsCount: entry.sessionsCount,
        label: deriveLabel(averageScore),
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to load skills overview', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load skills overview' },
      { status: 500 },
    );
  }
}
