import styles from './TabPlaceholder.module.css';

interface TabPlaceholderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actionLabel?: string;
}

export function TabPlaceholder({ title, description, eyebrow = 'Coming soon', actionLabel }: TabPlaceholderProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {actionLabel ? <span className={styles.action}>{actionLabel}</span> : null}
      </div>
    </div>
  );
}
