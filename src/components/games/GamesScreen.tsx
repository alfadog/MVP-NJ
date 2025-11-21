import {
  GAME_SKILL_DESCRIPTIONS,
  GAME_SKILL_LABELS,
  GAME_SKILL_ORDER,
  games,
  todaysGameIds,
} from '@/games/config';
import type { GameDefinition, GameSkillType } from '@/games/config';
import { getAvailableGames } from '@/games/utils';

import styles from './GamesScreen.module.css';
import { GameCard } from './GameCard';

// Filter to only show games with component implementations
const availableGames = getAvailableGames(games);

const gamesById = availableGames.reduce<Record<string, GameDefinition>>((acc, game) => {
  acc[game.id] = game;
  return acc;
}, {});

const gamesBySkill = availableGames.reduce<Record<GameSkillType, GameDefinition[]>>(
  (acc, game) => {
    if (!acc[game.skillType]) {
      acc[game.skillType] = [];
    }

    acc[game.skillType]!.push(game);

    return acc;
  },
  {} as Record<GameSkillType, GameDefinition[]>,
);

export function GamesScreen() {
  // Only show today's games that are available (have components)
  const todaysGames = todaysGameIds
    .map((id) => gamesById[id])
    .filter((game): game is GameDefinition => Boolean(game));

  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.appTitle}>Games</h1>
          <p className={styles.subtitle}>Pick a drill to train a specific skill lane.</p>
        </div>
        <div className={styles.resources}>
          <ResourceChip label="Flame" value="0" icon="🔥" />
          <ResourceChip label="Energy" value="1555" icon="⚡️" />
        </div>
      </div>

      <section className={styles.section}>
        <SectionTitle title="Today's games" subtitle="Fresh picks to keep the streak alive" />
        <div className={styles.slider}>
          {todaysGames.map((game) => (
            <GameCard key={game!.id} game={game!} />
          ))}
        </div>
      </section>

      {GAME_SKILL_ORDER.map((skillType) => {
        const skillGames = gamesBySkill[skillType] ?? [];

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
