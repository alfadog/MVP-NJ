'use client';

import styles from './GameHud.module.css';

interface GameHudProps {
  levelLabel: string;
  timerLabel: string;
  scoreLabel: string;
  onMenuClick: () => void;
}

export function GameHud({ levelLabel, timerLabel, scoreLabel, onMenuClick }: GameHudProps) {
  return (
    <div className={styles.hud}>
      <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Open game menu">
        ☰
      </button>
      <div className={styles.hudCenter}>
        <span className={styles.hudLabel}>Level</span>
        <strong>{levelLabel}</strong>
      </div>
      <div className={styles.hudStats}>
        <div>
          <span className={styles.hudLabel}>Time</span>
          <strong>{timerLabel}</strong>
        </div>
        <div>
          <span className={styles.hudLabel}>Score</span>
          <strong>{scoreLabel}</strong>
        </div>
      </div>
    </div>
  );
}
