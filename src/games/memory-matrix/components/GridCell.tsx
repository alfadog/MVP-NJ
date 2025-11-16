import styles from '../styles/MemoryMatrixGame.module.css';

type CellState = 'idle' | 'preview' | 'selected' | 'correct' | 'missed' | 'incorrect';

interface GridCellProps {
  state: CellState;
  onSelect: () => void;
  disabled: boolean;
}

export function GridCell({ state, onSelect, disabled }: GridCellProps) {
  return (
    <button
      type="button"
      className={`${styles.cell} ${styles[`cell_${state}`]}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === 'selected' || state === 'correct'}
    />
  );
}
