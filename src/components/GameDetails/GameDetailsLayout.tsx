'use client';

import { Button } from '@telegram-apps/telegram-ui';

import { GAME_SKILL_LABELS, type GameDefinition } from '@/games/config';
import { TopBar } from '@/components/TopBar';

import styles from './GameDetailsLayout.module.css';

interface GameDetailsLayoutProps {
  game: GameDefinition;
  onBack: () => void;
  onPlay: () => void;
  onZenMode?: () => void;
  onHowToPlay?: () => void;
}

export function GameDetailsLayout({ game, onBack, onPlay, onZenMode, onHowToPlay }: GameDetailsLayoutProps) {
  const skillLabel = GAME_SKILL_LABELS[game.skillType];

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <section className={styles.hero} style={{ background: game.heroBackground }}>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back to games">
            ←
          </button>
          <div className={styles.heroIcon} style={{ borderColor: game.accentColor }}>
            {game.icon}
          </div>
          <p className={styles.heroSkill}>{skillLabel}</p>
          <h1 className={styles.heroTitle}>{game.title}</h1>
          <p className={styles.heroSubtitle}>
            Exercise your <span>{game.heroHighlight}</span> skills by {game.heroDescription}
          </p>
        </section>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEyebrow}>{game.lpiLabel}</span>
              <Button mode="outline" size="s">
                Unlock
              </Button>
            </div>
            <p className={styles.cardDescription}>{game.lpiDescription}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEyebrow}>{game.badgeTitle}</span>
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
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(1, game.progressValue) * 100}%`, background: game.accentColor }}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEyebrow}>Legacy high scores</span>
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
              <span className={styles.cardEyebrow}>How to play</span>
              <p className={styles.cardDescription}>{game.howToPlay}</p>
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
