'use client';

import { Button, Card, List, Section } from '@telegram-apps/telegram-ui';

import { Link } from '@/components/Link/Link';
import { Page } from '@/components/Page';
import { GAME_SKILL_LABELS, games } from '@/games/config';
import { useGameSession } from '@/games/useGameSession';

interface GamePageProps {
  params: { slug: string };
}

export default function GameContainerPage({ params }: GamePageProps) {
  const game = games.find((entry) => entry.slug === params.slug);
  const { startedAt, startGame, finishGame } = useGameSession(game?.id ?? 'unknown');

  if (!game) {
    return <GameNotFound />;
  }

  const handleStart = () => {
    startGame();
  };

  const handleFinish = () => {
    if (!startedAt) {
      return;
    }

    const now = new Date();
    const durationMs = now.getTime() - startedAt.getTime();
    const score = 80 + Math.floor(Math.random() * 40);

    finishGame({
      score,
      durationMs,
    });
  };

  const skillLabel = GAME_SKILL_LABELS[game.skillType];

  return (
    <Page>
      <List>
        <Section header={game.title} footer={`${skillLabel} • ${game.shortDescription}`}>
          <Card type="plain">
            <Card.Cell subtitle="Session status">
              {startedAt ? 'In progress' : 'Not started'}
            </Card.Cell>
            <Card.Cell subtitle="Skill focus">{skillLabel}</Card.Cell>
            <Card.Cell>
              <Button mode="filled" size="l" stretched disabled={Boolean(startedAt)} onClick={handleStart}>
                Start game
              </Button>
            </Card.Cell>
            <Card.Cell>
              <Button
                mode="outline"
                size="l"
                stretched
                disabled={!startedAt}
                onClick={handleFinish}
              >
                Finish session
              </Button>
            </Card.Cell>
          </Card>
        </Section>
        <Section>
          <Card type="plain">
            <Card.Cell>
              <Link href="/games">
                <Button size="m" stretched mode="secondary">
                  Back to games
                </Button>
              </Link>
            </Card.Cell>
          </Card>
        </Section>
      </List>
    </Page>
  );
}

function GameNotFound() {
  return (
    <Page>
      <List>
        <Section header="Game not found" footer="Pick another challenge from the catalog">
          <Card type="plain">
            <Card.Cell subtitle="The requested game does not exist or is not ready yet." />
            <Card.Cell>
              <Link href="/games">
                <Button size="l" mode="filled" stretched>
                  Back to games
                </Button>
              </Link>
            </Card.Cell>
          </Card>
        </Section>
      </List>
    </Page>
  );
}
