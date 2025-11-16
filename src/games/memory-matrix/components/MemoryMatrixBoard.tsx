import { useMemo } from 'react';

import type { RoundFeedback } from '../logic/scoring';
import { GridCell } from './GridCell';
import styles from '../styles/MemoryMatrixGame.module.css';

type Phase = 'idle' | 'preview' | 'recall' | 'summary' | 'game-over';

interface MemoryMatrixBoardProps {
  gridSize: number;
  phase: Phase;
  activeCells: Set<number>;
  selection: Set<number>;
  feedback: RoundFeedback | null;
  onSelect: (index: number) => void;
}

export function MemoryMatrixBoard({
  gridSize,
  phase,
  activeCells,
  selection,
  feedback,
  onSelect,
}: MemoryMatrixBoardProps) {
  const cellStates = useMemo(() => {
    const totalCells = gridSize * gridSize;
    return Array.from({ length: totalCells }, (_, index) => {
      if (feedback) {
        if (feedback.correct.has(index)) return 'correct';
        if (feedback.missed.has(index)) return 'missed';
        if (feedback.incorrect.has(index)) return 'incorrect';
      }

      if (phase === 'preview' && activeCells.has(index)) {
        return 'preview';
      }

      if (phase === 'recall' && selection.has(index)) {
        return 'selected';
      }

      return 'idle';
    });
  }, [gridSize, feedback, phase, activeCells, selection]);

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Memory grid"
    >
      {cellStates.map((state, index) => (
        <GridCell key={index} state={state as any} disabled={phase !== 'recall'} onSelect={() => onSelect(index)} />
      ))}
    </div>
  );
}
