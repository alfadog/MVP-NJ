'use client';

import type { ReactNode } from 'react';

import styles from './TopBar.module.css';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: 'back' | 'close';
  rightSlot?: ReactNode;
  alignTitle?: 'center' | 'start';
}

export function TopBar({
  title,
  subtitle,
  onBack,
  backIcon = 'back',
  rightSlot,
  alignTitle = 'center',
}: TopBarProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.bar}>
        <div className={styles.safe} />
        <div className={styles.inner}>
          <div className={styles.leading}>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className={styles.leadingButton}
                aria-label={backIcon === 'close' ? 'Close' : 'Go back'}
              >
                {backIcon === 'close' ? '×' : '‹'}
              </button>
            ) : (
              <span className={styles.leadingPlaceholder} aria-hidden />
            )}
          </div>
          <div
            className={
              alignTitle === 'start'
                ? `${styles.titles} ${styles.titlesStart}`
                : styles.titles
            }
          >
            <p className={styles.title}>{title}</p>
            {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
          </div>
          <div className={styles.trailing}>
            {rightSlot ? rightSlot : <span className={styles.trailingPlaceholder} aria-hidden />}
          </div>
        </div>
      </header>
    </div>
  );
}
