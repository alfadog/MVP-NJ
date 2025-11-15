'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';

export default function StatsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="stats">
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
