'use client';

import { Button } from '@telegram-apps/telegram-ui';

import { GAME_SKILL_LABELS, type GameDefinition } from '@/games/config';

import styles from './GameDetailsLayout.module.css';

interface GameDetailsLayoutProps {
  game: GameDefinition;
  onBack: () => void;
  onPlay: () => void;
  onZenMode?: () => void;
  onHowToPlay?: () => void;
}

export function GameDetailsLayout({ game, onBack, onPlay, onZenMode, onHowToPlay }: GameDetailsLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.body}>
        <div className={styles.hero} style={{ background: game.heroBackground }}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Back to games"
          >
            ←
          </button>
          <div className={styles.heroTopRow}>
            <div className={styles.heroResources}>
              <HeroChip icon="🔥" label="Flame" value="0" />
              <HeroChip icon="⚡️" label="Energy" value="1167" />
            </div>
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroIcon} style={{ borderColor: game.accentColor }}>
              {game.icon}
            </div>
            <div>
              <p className={styles.heroEyebrow}>{GAME_SKILL_LABELS[game.skillType]}</p>
              <h1 className={styles.heroTitle}>{game.title}</h1>
              <p className={styles.heroSubtitle}>
                Exercise your <strong>{game.heroHighlight}</strong> skills by {game.heroDescription}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>{game.lpiLabel}</span>
              <Button mode="outline" size="s">
                Unlock
              </Button>
            </div>
            <p className={styles.cardDescription}>{game.lpiDescription}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>{game.badgeTitle}</span>
            </div>
            <p className={styles.cardDescription}>{game.badgeDescription}</p>
            <div className={styles.badgeIcons} aria-label="Badge progress">
              {game.badgeIcons.map((icon, index) => (
                <span key={`${icon}-${index}`}>{icon}</span>
              ))}
            </div>
            <div className={styles.progressLabelRow}>
              <span>{game.progressLabel}</span>
              <span>{game.progressTarget}</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${Math.min(1, game.progressValue) * 100}%`, background: game.accentColor }} />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>Legacy high scores</span>
            </div>
            <div className={styles.highScores}>
              {game.highScoreStats.map((stat) => (
                <div key={stat.label} className={styles.highScoreItem}>
                  <span className={styles.highScoreValue}>{stat.value}</span>
                  <span className={styles.highScoreLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className={`${styles.card} ${styles.howToPlay}`} onClick={onHowToPlay}>
            <div>
              <span className={styles.howToPlayLabel}>How to play</span>
              <p>{game.howToPlay}</p>
            </div>
            <span className={styles.howToPlayIcon}>›</span>
          </button>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Button size="l" mode="outline" className={styles.actionButton} onClick={onZenMode}>
          Zen Mode
        </Button>
        <Button size="l" mode="filled" className={styles.actionButton} onClick={onPlay}>
          Play
        </Button>
      </div>
    </div>
  );
}

function HeroChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.heroChip}>
      <span aria-hidden>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
