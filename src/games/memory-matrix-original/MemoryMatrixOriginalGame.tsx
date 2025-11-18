'use client';

import { useEffect, useRef } from 'react';

import type { GameComponentProps } from '../config';

import { MEMORY_MATRIX_ORIGINAL_CSS } from './memoryMatrixOriginalStyles';
import { initMemoryMatrixOriginalUI } from './ui';
import styles from './MemoryMatrixOriginalGame.module.css';

export function MemoryMatrixOriginalGame({ session, onExit }: GameComponentProps) {
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
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

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
    <div className={styles.fullscreenSurface}>
      <div ref={hostRef} className={styles.gameHost} data-testid="memory-matrix-original-host" />
    </div>
  );
}
