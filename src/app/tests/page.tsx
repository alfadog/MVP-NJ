'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';

export default function TestsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="tests">
        <TabPlaceholder
          title="Assessments"
          description="Self-paced diagnostics will live here so you can benchmark cognition throughout the year."
          actionLabel="Assessments opening soon"
        />
      </AppScaffold>
    </Page>
  );
}
