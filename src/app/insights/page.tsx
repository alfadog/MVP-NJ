'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';
import { TopBar } from '@/components/TopBar';

export default function InsightsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="insights">
        <div className="page-shell">
          <TabPlaceholder
            title="Insights"
            description="Unlock deeper pattern breakdowns, personalized recaps, and experiment results once premium tracking is wired up."
            actionLabel="Premium preview"
          />
        </div>
      </AppScaffold>
    </Page>
  );
}
