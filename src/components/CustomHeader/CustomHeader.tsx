'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { miniApp } from '@telegram-apps/sdk-react';

import styles from './CustomHeader.module.css';

const LOGO_SRC = '/logo.svg';

/**
 * Renders a faux Telegram header that visually blends with our app background.
 * The buttons simply proxy to the native Mini App controls so we can fully
 * customize the look without losing the expected behavior.
 */
export function CustomHeader() {
  const handleClose = useCallback(() => {
    miniApp.close.ifAvailable?.();
  }, []);

  const handleMinimize = useCallback(() => {
    // Telegram does not expose an explicit "collapse" API yet.
    // Keeping this in a standalone handler makes it easy to swap in the
    // official method once it appears.
    miniApp.close.ifAvailable?.();
  }, []);

  return (
    <>
      <div className={styles.spacer} aria-hidden />
      <header className={styles.header} aria-label="Telegram shell controls">
        <div className={styles.leading}>
          <button type="button" className={styles.textButton} onClick={handleClose}>
            Закрыть
          </button>
        </div>
        <div className={styles.logoWrap}>
          <Image
            src={LOGO_SRC}
            alt="Neuron Joy"
            width={120}
            height={32}
            priority
            className={styles.logo}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label="Menu">
            <span aria-hidden>…</span>
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Minimize app"
            onClick={handleMinimize}
          >
            <svg viewBox="0 0 20 20" aria-hidden focusable="false" className={styles.chevron}>
              <path d="M4 8l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
