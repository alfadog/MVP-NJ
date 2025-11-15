import Link from 'next/link';

import { GAME_SKILL_LABELS, type GameDefinition } from '@/games/config';

import styles from './GameCard.module.css';

interface GameCardProps {
  game: GameDefinition;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.slug}`} className={styles.card} prefetch>
      <div className={styles.art} style={{ background: game.heroBackground }} aria-hidden>
        <span>{game.icon}</span>
      </div>
      <div className={styles.title}>{game.title}</div>
      <div className={styles.skillTag} style={{ color: game.accentColor }}>
        {GAME_SKILL_LABELS[game.skillType]}
      </div>
    </Link>
  );
}
