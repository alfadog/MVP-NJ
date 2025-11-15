'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { GamesScreen } from '@/components/games';
import { Page } from '@/components/Page';
import { TopBar } from '@/components/TopBar';

export default function GamesPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="games">
        <TopBar title="Games" />
        <GamesScreen />
      </AppScaffold>
    </Page>
  );
}
