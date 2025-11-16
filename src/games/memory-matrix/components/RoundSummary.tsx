import styles from '../styles/MemoryMatrixGame.module.css';

interface RoundSummaryProps {
  title: string;
  body: string;
  accuracy: number;
  points: number;
  levelLabel: string;
  actionLabel: string;
  onAction: () => void;
}

export function RoundSummary({ title, body, accuracy, points, levelLabel, actionLabel, onAction }: RoundSummaryProps) {
  return (
    <div className={styles.summaryOverlay} role="dialog" aria-modal>
      <div className={styles.summaryCard}>
        <p className={styles.summaryLevel}>Level {levelLabel}</p>
        <h3>{title}</h3>
        <p className={styles.summaryBody}>{body}</p>
        <div className={styles.summaryStats}>
          <div>
            <span>Accuracy</span>
            <strong>{Math.round(accuracy * 100)}%</strong>
          </div>
          <div>
            <span>Points</span>
            <strong>{points}</strong>
          </div>
        </div>
        <button type="button" className={styles.summaryAction} onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
