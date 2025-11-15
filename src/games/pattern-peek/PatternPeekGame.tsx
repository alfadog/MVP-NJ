'use client';

import { useEffect, useRef, useState } from 'react';

import { GameHud } from '@/components/GameHud';

import type { GameComponentProps } from '../config';

import styles from './PatternPeekGame.module.css';

type Phase = 'idle' | 'showing' | 'recall' | 'finished';

const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const PATTERN_LENGTH = 3;
const REVEAL_DURATION_MS = 1500;

const STATUS_LABELS: Record<Phase, string> = {
  idle: 'Ready',
  showing: 'Memorize the pattern',
  recall: 'Recreate the pattern',
  finished: 'Round complete',
};

const INSTRUCTION_TEXT: Record<Phase, string> = {
  idle: 'Tap Start to reveal a quick flash of tiles, then recreate the pattern from memory.',
  showing: 'Watch closely. The highlighted tiles will fade after a second.',
  recall: 'Tap every tile you remember, then press Check pattern to score the round.',
  finished: 'Solid work. Review your score and run it back to keep improving.',
};

function generatePattern(): number[] {
  const pattern: number[] = [];

  while (pattern.length < PATTERN_LENGTH) {
    const candidate = Math.floor(Math.random() * TOTAL_CELLS);

    if (!pattern.includes(candidate)) {
      pattern.push(candidate);
    }
  }

  return pattern;
}

export function PatternPeekGame({ game, session, onExit }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [pattern, setPattern] = useState<number[]>([]);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'showing' || phase === 'recall') {
      const interval = setInterval(() => {
        if (roundStartedAt != null) {
          setElapsedMs(Date.now() - roundStartedAt);
        }
      }, 150);

      return () => clearInterval(interval);
    }

    setElapsedMs(0);
  }, [phase, roundStartedAt]);

  const startRound = () => {
    if (phase === 'showing' || phase === 'recall') {
      return;
    }

    const newPattern = generatePattern();
    setPattern(newPattern);
    setSelection(new Set());
    setScore(null);
    setFeedback(null);
    setPhase('showing');
    setRoundStartedAt(Date.now());
    setElapsedMs(0);
    setIsMenuOpen(false);
    setShowHowTo(false);
    session.startGame();

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = setTimeout(() => {
      setPhase('recall');
    }, REVEAL_DURATION_MS);
  };

  const toggleCell = (index: number) => {
    if (phase !== 'recall') {
      return;
    }

    setSelection((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const finishRound = () => {
    if (phase !== 'recall') {
      return;
    }

    const patternSet = new Set(pattern);
    let correctSelected = 0;

    selection.forEach((value) => {
      if (patternSet.has(value)) {
        correctSelected += 1;
      }
    });

    const extra = selection.size - correctSelected;
    const totalPattern = pattern.length;
    const accuracy = totalPattern === 0 ? 0 : correctSelected / totalPattern;
    const penalty = extra * 0.25;
    const normalized = Math.max(0, Math.min(1, accuracy - penalty));
    const computedScore = Math.round(normalized * 100);
    const durationMs = roundStartedAt != null ? Date.now() - roundStartedAt : undefined;
    const missed = Math.max(0, totalPattern - correctSelected);

    session.finishGame({
      score: computedScore,
      durationMs,
      meta: {
        patternSize: totalPattern,
        correctSelected,
        missed,
        extra,
      },
    });

    setScore(computedScore);
    setFeedback(computedScore >= 90 ? 'Perfect recall' : computedScore >= 60 ? 'Good job' : 'Keep practicing');
    setPhase('finished');
    setPattern([]);
    setSelection(new Set());
    setRoundStartedAt(null);
    setElapsedMs(0);
  };

  const resetRound = () => {
    setPhase('idle');
    setPattern([]);
    setSelection(new Set());
    setScore(null);
    setFeedback(null);
    setRoundStartedAt(null);
    setElapsedMs(0);
    setIsMenuOpen(false);
    setShowHowTo(false);
  };

  const renderGrid = () => (
    <div className={styles.grid} aria-label={`${game.title} grid`}>
      {Array.from({ length: TOTAL_CELLS }, (_, index) => {
        const isInPattern = pattern.includes(index);
        const isSelected = selection.has(index);
        const cellClasses = [styles.cell];

        if (phase === 'showing' && isInPattern) {
          cellClasses.push(styles.cellShowing);
        }

        if (phase === 'recall' && isSelected) {
          cellClasses.push(styles.cellSelected);
        }

        return (
          <button
            key={index}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Cell ${index + 1}`}
            onClick={() => toggleCell(index)}
            disabled={phase !== 'recall'}
            className={cellClasses.join(' ')}
          />
        );
      })}
    </div>
  );

  const formattedTimer =
    (phase === 'showing' || phase === 'recall') && roundStartedAt != null
      ? `${(elapsedMs / 1000).toFixed(1)}s`
      : '0.0s';
  const scoreLabel = score != null ? `${score}` : '--';

  const openMenu = () => {
    setIsMenuOpen(true);
    setShowHowTo(false);
  };

  const handleExit = () => {
    setIsMenuOpen(false);
    onExit();
  };

  const handleRestart = () => {
    resetRound();
    setIsMenuOpen(false);
  };

  return (
    <div className={styles.game}>
      <GameHud levelLabel="1" timerLabel={formattedTimer} scoreLabel={scoreLabel} onMenuClick={openMenu} />

      <div className={styles.stage}>
        <span className={styles.statusPill}>{STATUS_LABELS[phase]}</span>
        <div className={styles.gridWrapper}>{renderGrid()}</div>
      </div>

      <div className={styles.controls}>
        <p className={styles.instructions}>{INSTRUCTION_TEXT[phase]}</p>
        <div className={styles.buttonStack}>
          {phase === 'idle' && (
            <button type="button" className={styles.primaryButton} onClick={startRound}>
              Start round
            </button>
          )}

          {phase === 'showing' && <p className={styles.helperText}>Memorize the glowing tiles.</p>}

          {phase === 'recall' && (
            <>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={finishRound}
                disabled={selection.size === 0}
              >
                Check pattern
              </button>
              <button type="button" className={styles.secondaryButton} onClick={resetRound}>
                Reset selection
              </button>
            </>
          )}

          {phase === 'finished' && (
            <>
              {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
              <button type="button" className={styles.primaryButton} onClick={resetRound}>
                Play again
              </button>
            </>
          )}
        </div>
      </div>

      {isMenuOpen ? (
        <div className={styles.menuOverlay} role="dialog" aria-modal>
          <div className={styles.menuCard}>
            <div className={styles.menuHeader}>
              <h3>Paused</h3>
              <button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                ×
              </button>
            </div>
            <div className={styles.menuActions}>
              <button type="button" onClick={() => setIsMenuOpen(false)}>
                Resume
              </button>
              <button type="button" onClick={handleRestart}>
                Restart round
              </button>
              <button type="button" onClick={() => setShowHowTo((prev) => !prev)}>
                How to play
              </button>
              <button type="button" className={styles.exitButton} onClick={handleExit}>
                Exit to overview
              </button>
            </div>
            {showHowTo ? <p className={styles.menuDescription}>{game.howToPlay}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
