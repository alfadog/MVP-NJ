'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { TabPlaceholder } from '@/components/TabPlaceholder';
import { Page } from '@/components/Page';
import { TopBar } from '@/components/TopBar';

export default function TestsPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="tests">
        <TopBar title="Tests" />
        <div className="page-shell">
          <TabPlaceholder
            title="Assessments"
            description="Self-paced diagnostics will live here so you can benchmark cognition throughout the year."
            actionLabel="Assessments opening soon"
          />
        </div>
      </AppScaffold>
    </Page>
  );
}
