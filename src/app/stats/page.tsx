'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';
import { TopBar } from '@/components/TopBar';

export default function StatsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="stats">
        <TopBar title="Stats" />
        <div className="page-shell">
          <TabPlaceholder
            title="My stats"
            description="Track LPI trends, streaks, and per-skill history once data collection is enabled."
            actionLabel="Syncing soon"
          />
        </div>
      </AppScaffold>
    </Page>
  );
}
