import Image from 'next/image';
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
        {game.previewImage ? (
          <Image src={game.previewImage} alt="" width={64} height={64} className={styles.previewImage} sizes="64px" />
        ) : (
          <span>{game.icon}</span>
        )}
      </div>
      <div className={styles.title}>{game.title}</div>
      <div className={styles.skillTag} style={{ color: game.accentColor }}>
        {GAME_SKILL_LABELS[game.skillType]}
      </div>
    </Link>
  );
}
