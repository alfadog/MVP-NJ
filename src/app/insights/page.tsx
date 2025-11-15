'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';

export default function InsightsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="insights">
        <TabPlaceholder
          title="Insights"
          description="Unlock deeper pattern breakdowns, personalized recaps, and experiment results once premium tracking is wired up."
          actionLabel="Premium preview"
        />
      </AppScaffold>
    </Page>
  );
}
