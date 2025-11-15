'use client';

import { useState } from 'react';

interface GameResult {
  score: number;
  level?: number;
  durationMs?: number;
  meta?: any;
}

export function useGameSession(gameId: string) {
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const startGame = () => {
    if (!startedAt) {
      setStartedAt(new Date());
    }
  };

  const finishGame = (result: GameResult) => {
    const finishedAt = new Date();

    console.log({
      gameId,
      startedAt,
      finishedAt,
      result,
    });
  };

  return { startedAt, startGame, finishGame };
}
