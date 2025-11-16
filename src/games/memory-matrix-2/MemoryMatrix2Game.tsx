'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { GameHud } from '@/components/GameHud';
import type { GameComponentProps } from '@/games/config';
import { reportGameResult } from '@/games/reporting';

import { memoryMatrix2Copy } from './assets/copy';
import { MemoryMatrixBoard } from './components/MemoryMatrixBoard';
import { OverlayMenu } from './components/OverlayMenu';
import { RoundSummary } from './components/RoundSummary';
import { useRoundTimer } from './hooks/useRoundTimer';
import { MAX_LIVES, memoryMatrixLevels } from './logic/levels';
import { evaluateRound, type RoundFeedback, type RoundEvaluation } from './logic/scoring';
import { createPattern } from './utils/pattern';
import styles from './styles/MemoryMatrixGame.module.css';

type Phase = 'idle' | 'preview' | 'recall' | 'summary' | 'game-over';

export function MemoryMatrix2Game({ game, session, onExit }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('idle');
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

  const stageTitle = useMemo(() => {
    switch (phase) {
      case 'preview':
        return 'Memorize the pattern';
      case 'recall':
        return 'Recreate the grid';
      case 'summary':
        return 'Review your taps';
      case 'game-over':
        return memoryMatrix2Copy.gameOverTitle;
      default:
        return memoryMatrix2Copy.idleTitle;
    }
  }, [phase]);

  const helperText = useMemo(() => {
    switch (phase) {
      case 'preview':
        return memoryMatrix2Copy.previewPrompt;
      case 'recall':
        return memoryMatrix2Copy.recallPrompt;
      case 'summary':
        return memoryMatrix2Copy.summaryBody;
      case 'game-over':
        return memoryMatrix2Copy.gameOverBody;
      default:
        return memoryMatrix2Copy.idleSubtitle;
    }
  }, [phase]);

  const boardBanner = useMemo(() => {
    if (phase === 'preview') return 'Memorize';
    if (phase === 'recall') return 'Your turn';
    if (phase === 'summary') return 'Pattern';
    return null;
  }, [phase]);

  const beginRound = useCallback(
    (overrideIndex?: number) => {
      const index = overrideIndex ?? levelIndex;
      const nextLevel = memoryMatrixLevels[index];

      if (!nextLevel) {
        return;
      }

      if (overrideIndex !== undefined) {
        setLevelIndex(index);
      }

      const cells = nextLevel.gridSize * nextLevel.gridSize;
      const nextPattern = createPattern(cells, nextLevel.patternLength);

      if (!session.startedAt) {
        session.startGame();
      }

      setPattern(nextPattern);
      setSelection(new Set());
      setFeedback(null);
      setRoundResult(null);
      setActiveCells(new Set(nextPattern));
      setPhase('preview');
      setIsMenuOpen(false);
    },
    [levelIndex, session],
  );

  const resetGame = useCallback(() => {
    setPhase('idle');
    setLevelIndex(0);
    setPattern([]);
    setSelection(new Set());
    setFeedback(null);
    setRoundResult(null);
    setActiveCells(new Set());
    setScore(0);
    setLives(MAX_LIVES);
    setRoundsPlayed(0);
    setTotalTargets(0);
    setTotalCorrect(0);
    setIsMenuOpen(false);
  }, []);

  const finalizeRound = useCallback(
    (selectionSnapshot: Set<number>) => {
      const level = memoryMatrixLevels[levelIndex];

      if (!level) {
        return;
      }

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

      const willContinue = evaluation.status === 'success' || nextLives > 0;
      setPhase(willContinue ? 'summary' : 'game-over');
    },
    [elapsedMs, game.id, levelIndex, lives, pattern],
  );

  useEffect(() => {
    if (phase !== 'preview') {
      setActiveCells((prev) => (prev.size ? new Set() : prev));
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
    if (phase !== 'recall') {
      return;
    }

    if (pattern.length === 0) {
      return;
    }

    if (selection.size !== pattern.length) {
      return;
    }

    finalizeRound(new Set(selection));
  }, [phase, selection, pattern, finalizeRound]);

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

  const handleMenuRestart = () => {
    beginRound(levelIndex);
  };

  const handleSummaryAction = () => {
    if (phase === 'summary') {
      beginRound();
    } else if (phase === 'game-over') {
      resetGame();
      beginRound(0);
    }
  };

  const formattedScore = score.toString().padStart(2, '0');
  const levelLabel = `L${currentLevel?.id ?? 1}`;
  const overallAccuracy = totalTargets === 0 ? 0 : totalCorrect / totalTargets;

  return (
    <div className={styles.game}>
      <GameHud levelLabel={levelLabel} timerLabel={timerLabel} scoreLabel={formattedScore} onMenuClick={() => setIsMenuOpen(true)} />

      <div className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <p className={styles.phaseLabel}>Memory</p>
            <h2 className={styles.stageTitle}>{stageTitle}</h2>
          </div>
          <div className={styles.lives} aria-label="Lives">
            {Array.from({ length: MAX_LIVES }, (_, index) => (
              <span key={index} className={`${styles.life} ${index < lives ? styles.lifeActive : ''}`} />
            ))}
          </div>
        </div>
        <p className={styles.helperText}>{helperText}</p>

        <div className={styles.boardWrapper}>
          {boardBanner ? <span className={styles.statusRibbon}>{boardBanner}</span> : null}

          <MemoryMatrixBoard
            gridSize={currentLevel?.gridSize ?? 3}
            phase={phase}
            activeCells={activeCells}
            selection={selection}
            feedback={feedback}
            onSelect={handleCellSelect}
          />

          {phase === 'idle' ? (
            <div className={styles.introOverlay}>
              <div className={styles.introCard}>
                <h3>{memoryMatrix2Copy.idleTitle}</h3>
                <p>{memoryMatrix2Copy.idleSubtitle}</p>
                <button type="button" className={styles.introButton} onClick={() => beginRound(0)}>
                  {memoryMatrix2Copy.startButtonLabel}
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'summary' && roundResult ? (
            <RoundSummary
              title={
                roundResult.status === 'success'
                  ? memoryMatrix2Copy.summarySuccessTitle
                  : memoryMatrix2Copy.summaryFailTitle
              }
              body={memoryMatrix2Copy.summaryBody}
              accuracy={roundResult.accuracy}
              points={roundResult.pointsAwarded}
              levelLabel={roundResult.levelId.toString()}
              actionLabel={roundResult.status === 'success' ? 'Next pattern' : 'Try again'}
              onAction={handleSummaryAction}
            />
          ) : null}

          {phase === 'game-over' ? (
            <RoundSummary
              title={memoryMatrix2Copy.gameOverTitle}
              body={memoryMatrix2Copy.gameOverBody}
              accuracy={overallAccuracy}
              points={score}
              levelLabel={(roundResult?.levelId ?? currentLevel?.id ?? 1).toString()}
              actionLabel="Play again"
              onAction={handleSummaryAction}
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
      </div>
    </div>
  );
}
