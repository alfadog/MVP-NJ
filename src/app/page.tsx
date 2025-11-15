'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';
import { TopBar } from '@/components/TopBar';

export default function TodayPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="today">
        <div className="page-shell">
          <TabPlaceholder
            title="Daily workout"
            description="Your personalized warmup rotates Memory, Speed, and Attention each day. Come back soon to unlock the full workout flow."
            eyebrow="Hi, Trainer"
            actionLabel="Next set unlocks today at 09:00"
          />
        </div>
      </AppScaffold>
    </Page>
  );
}
