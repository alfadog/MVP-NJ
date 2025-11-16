'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GameComponentProps } from '@/games/config';
import { reportGameResult } from '@/games/reporting';

import { memoryMatrixCopy } from './assets/copy';
import { MemoryMatrixBoard } from './components/MemoryMatrixBoard';
import { OverlayMenu } from './components/OverlayMenu';
import { RoundSummary } from './components/RoundSummary';
import { useRoundTimer } from './hooks/useRoundTimer';
import { MAX_LIVES, memoryMatrixLevels } from './logic/levels';
import { evaluateRound, type RoundEvaluation, type RoundFeedback } from './logic/scoring';
import { createPattern } from './utils/pattern';
import styles from './styles/MemoryMatrixGame.module.css';

type Phase = 'intro' | 'preview' | 'recall' | 'summary' | 'game-over';

const PHASE_HELPERS: Record<Phase, { helper: string; badge: string | null }> = {
  intro: { helper: 'Tap start to reveal the flashing pattern.', badge: null },
  preview: { helper: memoryMatrixCopy.previewPrompt, badge: 'Preview' },
  recall: { helper: memoryMatrixCopy.recallPrompt, badge: 'Your turn' },
  summary: { helper: memoryMatrixCopy.summaryBody, badge: 'Results' },
  'game-over': { helper: memoryMatrixCopy.gameOverBody, badge: null },
};

export function MemoryMatrixGame({ game, session, onExit }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [levelIndex, setLevelIndex] = useState(0);
  const [pattern, setPattern] = useState<number[]>([]);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [activeCells, setActiveCells] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<RoundFeedback | null>(null);
  const [roundResult, setRoundResult] = useState<RoundEvaluation | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentLevel = memoryMatrixLevels[levelIndex];
  const { elapsedMs, formatted: timerLabel } = useRoundTimer(phase === 'recall');
  const phaseHelper = PHASE_HELPERS[phase];

  const formattedScore = useMemo(() => score.toString().padStart(5, '0'), [score]);
  const overallAccuracy = totalTargets === 0 ? 0 : totalCorrect / totalTargets;

  const beginRound = useCallback(
    (forcedIndex?: number) => {
      const nextIndex = forcedIndex ?? levelIndex;
      const level = memoryMatrixLevels[nextIndex];

      if (!level) {
        return;
      }

      if (forcedIndex !== undefined) {
        setLevelIndex(nextIndex);
      }

      if (!session.startedAt) {
        session.startGame();
      }

      const cellCount = level.gridSize * level.gridSize;
      const nextPattern = createPattern(cellCount, level.patternLength);

      setPattern(nextPattern);
      setSelection(new Set());
      setActiveCells(new Set(nextPattern));
      setFeedback(null);
      setRoundResult(null);
      setPhase('preview');
      setIsMenuOpen(false);
    },
    [levelIndex, session],
  );

  const resetGame = useCallback(() => {
    setPhase('intro');
    setLevelIndex(0);
    setPattern([]);
    setSelection(new Set());
    setActiveCells(new Set());
    setFeedback(null);
    setRoundResult(null);
    setScore(0);
    setLives(MAX_LIVES);
    setRoundsPlayed(0);
    setTotalTargets(0);
    setTotalCorrect(0);
    setIsMenuOpen(false);
  }, []);

  const submitRound = useCallback(() => {
    if (phase !== 'recall') {
      return;
    }

    const level = memoryMatrixLevels[levelIndex];

    if (!level) {
      return;
    }

    const selectionSnapshot = new Set(selection);
    const evaluation = evaluateRound(pattern, selectionSnapshot, level, elapsedMs);
    const nextLives = evaluation.status === 'fail' ? Math.max(0, lives - 1) : lives;

    setFeedback(evaluation.feedback);
    setRoundResult(evaluation);
    setScore((prev) => prev + evaluation.pointsAwarded);
    setRoundsPlayed((prev) => prev + 1);
    setTotalTargets((prev) => prev + evaluation.totalTargets);
    setTotalCorrect((prev) => prev + evaluation.correct);
    setLives(nextLives);

    reportGameResult(game.id, evaluation.pointsAwarded, evaluation.accuracy, evaluation.levelId);

    if (evaluation.status === 'success') {
      setLevelIndex((prev) => Math.min(prev + 1, memoryMatrixLevels.length - 1));
    }

    const canContinue = evaluation.status === 'success' || nextLives > 0;
    setPhase(canContinue ? 'summary' : 'game-over');
  }, [elapsedMs, game.id, levelIndex, lives, pattern, phase, selection]);

  useEffect(() => {
    if (phase !== 'preview') {
      setActiveCells((prev) => {
        if (prev.size === 0) {
          return prev;
        }
        return new Set();
      });
      return;
    }

    const level = memoryMatrixLevels[levelIndex];

    if (!level) {
      return;
    }

    const timeout = setTimeout(() => {
      setActiveCells(new Set());
      setPhase('recall');
    }, level.previewDuration);

    return () => clearTimeout(timeout);
  }, [phase, levelIndex]);

  useEffect(() => {
    if (phase !== 'game-over') {
      return;
    }

    const accuracy = totalTargets === 0 ? 0 : totalCorrect / totalTargets;

    session.finishGame({
      score,
      level: roundResult?.levelId ?? currentLevel?.id,
      meta: {
        roundsPlayed,
        accuracy,
        livesRemaining: lives,
      },
    });
  }, [phase, session, score, roundResult, currentLevel, roundsPlayed, totalTargets, totalCorrect, lives]);

  const handleCellSelect = (index: number) => {
    if (phase !== 'recall') {
      return;
    }

    setSelection((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
        return next;
      }

      if (next.size >= pattern.length) {
        return next;
      }

      next.add(index);
      return next;
    });
  };

  const handleSummaryAction = () => {
    if (phase === 'summary') {
      beginRound();
    } else if (phase === 'game-over') {
      resetGame();
      beginRound(0);
    }
  };

  const handleMenuRestart = () => {
    beginRound(levelIndex);
  };

  const helperText = phaseHelper?.helper ?? '';
  const boardBadge = phaseHelper?.badge ?? null;
  const canSubmit = phase === 'recall' && selection.size === pattern.length;

  const summaryMeta = useMemo(() => {
    if (!roundResult) {
      return [];
    }

    return [
      { label: 'Correct', value: `${roundResult.correct}/${roundResult.totalTargets}` },
      { label: 'Time', value: `${(roundResult.elapsedMs / 1000).toFixed(1)}s` },
    ];
  }, [roundResult]);

  const finalMeta = useMemo(
    () => [
      { label: 'Rounds', value: roundsPlayed.toString() },
      { label: 'Lives left', value: `${lives}` },
    ],
    [roundsPlayed, lives],
  );

  return (
    <div className={styles.matrix}>
      <header className={styles.hud}>
        <button type="button" className={styles.hudButton} onClick={() => setIsMenuOpen(true)}>
          Menu
        </button>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Timer</span>
          <strong className={styles.hudValue}>{timerLabel}</strong>
        </div>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Score</span>
          <strong className={styles.hudValue}>{formattedScore}</strong>
        </div>
      </header>

      <div className={styles.levelBadge}>Level {currentLevel?.id ?? 1}</div>

      <div className={styles.livesRow} aria-label="Lives">
        {Array.from({ length: MAX_LIVES }, (_, index) => (
          <span key={index} className={`${styles.life} ${index < lives ? styles.lifeActive : ''}`} />
        ))}
      </div>

      <div className={styles.stage}>
        <p className={styles.helper}>{helperText}</p>

        <div className={styles.boardShell}>
          {boardBadge ? <span className={styles.boardBadge}>{boardBadge}</span> : null}

          <MemoryMatrixBoard
            gridSize={currentLevel?.gridSize ?? 3}
            phase={phase}
            activeCells={activeCells}
            selection={selection}
            feedback={feedback}
            onSelect={handleCellSelect}
          />

          {phase === 'intro' ? (
            <div className={styles.introOverlay}>
              <div className={styles.introCard}>
                <p className={styles.introLabel}>{memoryMatrixCopy.title}</p>
                <h3 className={styles.introTitle}>{memoryMatrixCopy.introTitle}</h3>
                <p className={styles.introBody}>{memoryMatrixCopy.introSubtitle}</p>
                <button type="button" className={styles.introButton} onClick={() => beginRound(0)}>
                  {memoryMatrixCopy.startLabel}
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'summary' && roundResult ? (
            <RoundSummary
              title={roundResult.status === 'success' ? memoryMatrixCopy.summarySuccessTitle : memoryMatrixCopy.summaryFailTitle}
              body={memoryMatrixCopy.summaryBody}
              accuracy={roundResult.accuracy}
              points={roundResult.pointsAwarded}
              levelLabel={roundResult.levelId.toString()}
              actionLabel={roundResult.status === 'success' ? 'Continue' : 'Retry level'}
              onAction={handleSummaryAction}
              meta={summaryMeta}
            />
          ) : null}

          {phase === 'game-over' ? (
            <RoundSummary
              title={memoryMatrixCopy.gameOverTitle}
              body={memoryMatrixCopy.gameOverBody}
              accuracy={overallAccuracy}
              points={score}
              levelLabel={(roundResult?.levelId ?? currentLevel?.id ?? 1).toString()}
              actionLabel="Play again"
              onAction={handleSummaryAction}
              meta={finalMeta}
            />
          ) : null}

          {isMenuOpen ? (
            <OverlayMenu
              onResume={() => setIsMenuOpen(false)}
              onRestart={() => {
                setIsMenuOpen(false);
                handleMenuRestart();
              }}
              onExit={() => {
                setIsMenuOpen(false);
                resetGame();
                onExit();
              }}
            />
          ) : null}
        </div>

        <div className={styles.levelMeta}>
          <div>
            <span>Grid</span>
            <strong>
              {currentLevel?.gridSize ?? 3}×{currentLevel?.gridSize ?? 3}
            </strong>
          </div>
          <div>
            <span>Tiles</span>
            <strong>{currentLevel?.patternLength ?? 3}</strong>
          </div>
        </div>

        {phase === 'recall' ? (
          <div className={styles.controls}>
            <button type="button" className={styles.actionButton} disabled={!canSubmit} onClick={submitRound}>
              {memoryMatrixCopy.submitLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
