'use client';

import { AppScaffold } from '@/components/AppScaffold';
import { GamesScreen } from '@/components/games';
import { Page } from '@/components/Page';

export default function GamesPage() {
  return (
    <Page back={false}>
      <AppScaffold activeTab="games">
        <GamesScreen />
      </AppScaffold>
    </Page>
  );
}
