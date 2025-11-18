'use client';

import { useEffect, useRef } from 'react';
import { miniApp, useSignal } from '@telegram-apps/sdk-react';

import type { GameComponentProps } from '../config';

import { MEMORY_MATRIX_ORIGINAL_CSS } from './memoryMatrixOriginalStyles';
import { initMemoryMatrixOriginalUI } from './ui';
import type { ThemeScheme } from './types';
import styles from './MemoryMatrixOriginalGame.module.css';

export function MemoryMatrixOriginalGame({ session, onExit }: GameComponentProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const startGameRef = useRef(session.startGame);
  const finishGameRef = useRef(session.finishGame);
  const exitRef = useRef(onExit);
  const isDark = useSignal(miniApp.isDark);
  const preferredScheme = (isDark ? 'dark' : 'light') as ThemeScheme;
  const initialSchemeRef = useRef<ThemeScheme | null>(null);
  if (initialSchemeRef.current === null) {
    initialSchemeRef.current = preferredScheme;
  }

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

    host.setAttribute('data-theme', preferredScheme);
  }, [preferredScheme]);

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

    const cleanup = initMemoryMatrixOriginalUI({
      container: root,
      hostElement: host,
      initialScheme: initialSchemeRef.current ?? 'light',
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
    <div className={styles.fullscreen}>
      <div ref={hostRef} className={styles.gameHost} />
    </div>
  );
}
