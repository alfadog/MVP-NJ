import styles from '../styles/MemoryMatrixGame.module.css';

interface OverlayMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function OverlayMenu({ onResume, onRestart, onExit }: OverlayMenuProps) {
  return (
    <div className={styles.menuOverlay} role="dialog" aria-modal>
      <div className={styles.menuCard}>
        <header>
          <h3>Paused</h3>
        </header>
        <div className={styles.menuActions}>
          <button type="button" onClick={onResume}>
            Resume round
          </button>
          <button type="button" onClick={onRestart}>
            Restart level
          </button>
          <button type="button" className={styles.menuExit} onClick={onExit}>
            Exit to preview
          </button>
        </div>
      </div>
    </div>
  );
}
