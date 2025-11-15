import type { PropsWithChildren } from 'react';
import Link from 'next/link';

import styles from './AppScaffold.module.css';

export type AppTab = 'today' | 'games' | 'stats' | 'insights' | 'tests';

const TAB_CONFIG: { key: AppTab; label: string; href: string; icon: string }[] = [
  { key: 'today', label: 'Today', href: '/', icon: '📅' },
  { key: 'games', label: 'Games', href: '/games', icon: '🎮' },
  { key: 'stats', label: 'Stats', href: '/stats', icon: '📊' },
  { key: 'insights', label: 'Insights', href: '/insights', icon: '💡' },
  { key: 'tests', label: 'Tests', href: '/tests', icon: '🧠' },
];

interface AppScaffoldProps extends PropsWithChildren {
  activeTab: AppTab;
}

export function AppScaffold({ activeTab, children }: AppScaffoldProps) {
  return (
    <div className={styles.scaffold}>
      <main className={styles.content}>{children}</main>
      <nav className={styles.tabBar} aria-label="Primary navigation">
        {TAB_CONFIG.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`${styles.tabLink} ${activeTab === tab.key ? styles.tabLinkActive : ''}`}
            aria-current={activeTab === tab.key ? 'page' : undefined}
          >
            <span className={styles.tabIcon} aria-hidden>
              {tab.icon}
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
