import {
  GAME_SKILL_DESCRIPTIONS,
  GAME_SKILL_LABELS,
  GAME_SKILL_ORDER,
  games,
  todaysGameIds,
} from '@/games/config';
import type { GameDefinition } from '@/games/config';

import styles from './GamesScreen.module.css';
import { GameCard } from './GameCard';

export function GamesScreen() {
  const todaysGames = todaysGameIds
    .map((id) => games.find((game) => game.id === id))
    .filter((game): game is GameDefinition => Boolean(game));

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.resources}>
          <ResourceChip label="Flame" value="0" icon="🔥" />
          <ResourceChip label="Energy" value="1167" icon="⚡️" />
        </div>
        <h1 className={styles.pageTitle}>Games</h1>
        <p className={styles.pageSubtitle}>Pick a drill to train a specific skill lane.</p>
      </header>

      <section className={styles.section}>
        <SectionTitle title="Today's games" subtitle="Fresh picks to keep the streak alive" />
        <div className={styles.slider}>
          {todaysGames.map((game) => (
            <GameCard key={game!.id} game={game!} />
          ))}
        </div>
      </section>

      {GAME_SKILL_ORDER.map((skillType) => {
        const skillGames = games.filter((game) => game.skillType === skillType);

        if (!skillGames.length) {
          return null;
        }

        return (
          <section key={skillType} className={styles.section}>
            <SectionTitle
              title={GAME_SKILL_LABELS[skillType]}
              subtitle={GAME_SKILL_DESCRIPTIONS[skillType]}
            />
            <div className={styles.slider}>
              {skillGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function ResourceChip({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className={styles.resourceChip}>
      <span className={styles.resourceIcon}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
