'use client';

import { useEffect, useRef } from 'react';

import type { GameComponentProps } from '../config';

import { MEMORY_MATRIX_ORIGINAL_CSS } from './memoryMatrixOriginalStyles';
import { initMemoryMatrixOriginalUI } from './ui';
import styles from './MemoryMatrixOriginalGame.module.css';

export function MemoryMatrixOriginalGame({ game, session, onExit }: GameComponentProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const startGameRef = useRef(session.startGame);
  const finishGameRef = useRef(session.finishGame);
  const exitRef = useRef(onExit);

  useEffect(() => {
    startGameRef.current = session.startGame;
  }, [session.startGame]);

  useEffect(() => {
    finishGameRef.current = session.finishGame;
  }, [session.finishGame]);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '';

    const styleEl = document.createElement('style');
    styleEl.textContent = MEMORY_MATRIX_ORIGINAL_CSS;
    shadow.append(styleEl);

    const root = document.createElement('div');
    shadow.append(root);

    const scheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const cleanup = initMemoryMatrixOriginalUI({
      container: root,
      hostElement: host,
      initialScheme: scheme,
      onStartGame: () => {
        startGameRef.current();
      },
      onFinishGame: (result) => {
        finishGameRef.current(result);
      },
      onExit: () => {
        exitRef.current();
      },
    });

    return () => {
      cleanup();
      shadow.innerHTML = '';
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.backButton} onClick={onExit}>
          ‹ Games
        </button>
        <div className={styles.toolbarTitle}>
          <strong>{game.title}</strong>
          <span>Original mode</span>
        </div>
        <span className={styles.toolbarSpacer} aria-hidden>
          ​
        </span>
      </div>
      <div className={styles.surface}>
        <div ref={hostRef} className={styles.gameHost} />
      </div>
    </div>
  );
}
