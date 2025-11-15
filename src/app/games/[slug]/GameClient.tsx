'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GameDetailsLayout } from '@/components/GameDetails';
import { Page } from '@/components/Page';
import { GAME_SKILL_LABELS, games, type GameDefinition } from '@/games/config';
import { PatternPeekGame } from '@/games/pattern-peek/PatternPeekGame';
import type { GameComponentProps } from '@/games/config';
import { useGameSession } from '@/games/useGameSession';
import { TopBar } from '@/components/TopBar';

import styles from './GameClient.module.css';

interface GameClientProps {
  slug: string;
}

type GameViewMode = 'details' | 'playing';

export function GameClient({ slug }: GameClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<GameViewMode>('details');
  const game = games.find((entry) => entry.slug === slug);

  useEffect(() => {
    setMode('details');
  }, [slug]);

  if (!game) {
    return (
      <Page>
        <div className={styles.notFound}>
          <h1>Game not found</h1>
          <p>We could not locate this drill. Please return to the catalog.</p>
          <button type="button" onClick={() => router.push('/games')}>
            Back to games
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page back={false}>
      {mode === 'details' ? (
        <GameDetailsLayout
          game={game}
          onBack={() => router.push('/games')}
          onPlay={() => setMode('playing')}
          onZenMode={() => console.log(`Zen Mode coming soon for ${game.title}`)}
          onHowToPlay={() => console.log(`How to play ${game.title}`)}
        />
      ) : (
        <GamePlaySurface game={game} onExit={() => setMode('details')} />
      )}
    </Page>
  );
}

function GamePlaySurface({ game, onExit }: { game: GameDefinition; onExit: () => void }) {
  const { startedAt, startGame, finishGame } = useGameSession(game.id, game.skillType);
  const GameComponent = game.component ?? PatternPeekGame;
  const sessionApi: GameComponentProps['session'] = { startedAt, startGame, finishGame };

  return (
    <div className={styles.playSurface}>
      <TopBar
        title={game.title}
        subtitle={GAME_SKILL_LABELS[game.skillType]}
        onBack={onExit}
        alignTitle="start"
        rightSlot={<span className={styles.playStatus}>Level 1</span>}
      />
      <div className={styles.playBody}>
        <div className={styles.playArea}>
          {GameComponent ? (
            <GameComponent game={game} session={sessionApi} />
          ) : (
            <div className={styles.playFallback}>
              <p>Gameplay prototype coming soon.</p>
              <button type="button" onClick={onExit}>
                Back to overview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
