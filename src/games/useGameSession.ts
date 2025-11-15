'use client';

import { initDataState as initDataStateSignal, useSignal } from '@telegram-apps/sdk-react';
import { useState } from 'react';

import type { GameSkillType } from './config';

interface GameResult {
  score: number;
  level?: number;
  durationMs?: number;
  meta?: any;
}

export function useGameSession(gameId: string, skillType: GameSkillType) {
  const initDataState = useSignal(initDataStateSignal);
  const user = initDataState?.user;
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const startGame = () => {
    if (!startedAt) {
      setStartedAt(new Date());
    }
  };

  const finishGame = async (result: GameResult) => {
    if (!startedAt) {
      return;
    }

    const finishedAt = new Date();

    console.log({
      gameId,
      skillType,
      startedAt,
      finishedAt,
      result,
    });

    try {
      const response = await fetch('/api/game-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            id: user?.id?.toString() ?? 'anonymous',
            username: user?.username ?? null,
            firstName: user?.first_name ?? null,
            lastName: user?.last_name ?? null,
          },
          gameId,
          skillType,
          score: result.score,
          level: result.level,
          durationMs: result.durationMs,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          meta: result.meta ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.error('Failed to persist game session', error);
    } finally {
      setStartedAt(null);
    }
  };

  return { startedAt, startGame, finishGame };
}
