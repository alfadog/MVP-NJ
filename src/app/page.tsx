'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';
import { InputSurface } from '@/components/input/InputSurface';
import type { NormalizedInputEvent } from '@/core/input';

export default function TodayPage() {
  const handleTap = (event: NormalizedInputEvent) => {
    console.debug('Dashboard tap', {
      x: event.x,
      y: event.y,
      timestamp: event.timestamp,
    });
  };

  return (
    <Page back={false}>
      <AppScaffold activeTab="today">
        <InputSurface
          className="page-shell"
          options={{ enableTaps: true, enableSwipes: false }}
          onTap={handleTap}
        >
          <TabPlaceholder
            title="Daily workout"
            description="Your personalized warmup rotates Memory, Speed, and Attention each day. Come back soon to unlock the full workout flow."
            eyebrow="Hi, Trainer"
            actionLabel="Next set unlocks today at 09:00"
          />
        </InputSurface>
      </AppScaffold>
    </Page>
  );
}
