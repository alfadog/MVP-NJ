'use client';

import { initDataState as _initDataState, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Card, List, Section } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

import { GAME_SKILL_LABELS, games, type GameSkillType } from '@/games/config';
import { Page } from '@/components/Page';

const SKILL_OVERVIEW = [
  { name: 'Memory', score: 128, label: 'Strong' },
  { name: 'Speed', score: 112, label: 'Steady' },
  { name: 'Attention / Focus', score: 95, label: 'Focused' },
  { name: 'Flexibility', score: 88, label: 'Improving' },
  { name: 'Math / Logic', score: 102, label: 'Balanced' },
];

interface RecentSession {
  id: string;
  gameId: string;
  skillType: string;
  score: number;
  level?: number | null;
  durationMs?: number | null;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

const GAME_TITLES: Record<string, string> = games.reduce((acc, game) => {
  acc[game.id] = game.title;
  return acc;
}, {} as Record<string, string>);

export default function ProfilePage() {
  const initDataState = useSignal(_initDataState);
  const user = initDataState?.user;
  const userId = user?.id ? user.id.toString() : null;
  const [recentSessions, setRecentSessions] = useState<RecentSession[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRecentSessions(null);
      setRecentLoading(false);
      return;
    }

    let cancelled = false;
    const fetchSessions = async () => {
      setRecentLoading(true);
      setRecentError(null);

      try {
        const response = await fetch(`/api/game-sessions/recent?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data: RecentSession[] = await response.json();
        if (!cancelled) {
          setRecentSessions(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch recent sessions', error);
          setRecentError('Unable to load recent sessions');
        }
      } finally {
        if (!cancelled) {
          setRecentLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ')
    : 'Telegram User';
  const usernameLine = user?.username ? `@${user.username}` : 'Mini App tester';

  const renderRecentActivity = () => {
    if (!userId) {
      return (
        <Card.Cell subtitle="Mini App needs Telegram context to sync progress.">
          No Telegram user detected
        </Card.Cell>
      );
    }

    if (recentLoading) {
      return <Card.Cell>Loading recent sessions…</Card.Cell>;
    }

    if (recentError) {
      return (
        <Card.Cell subtitle="Try again after refreshing the Mini App.">
          {recentError}
        </Card.Cell>
      );
    }

    if (!recentSessions?.length) {
      return (
        <Card.Cell subtitle="Play a game to see it show up here.">
          No sessions recorded yet
        </Card.Cell>
      );
    }

    return recentSessions.map((session) => {
      const skillLabel =
        GAME_SKILL_LABELS[session.skillType as GameSkillType] ?? session.skillType;
      const durationLabel = formatDuration(session.durationMs);
      const title = GAME_TITLES[session.gameId] ?? session.gameId;

      return (
        <Card.Cell
          key={session.id}
          subtitle={`${skillLabel} • duration: ${durationLabel}`}
          after={<span style={{ fontWeight: 600 }}>{session.score}</span>}
        >
          {title}
        </Card.Cell>
      );
    });
  };

  return (
    <Page>
      <List>
        <Section header="Profile">
          <Card type="plain">
            <Card.Cell
              before={
                <Avatar
                  size={56}
                  src={user?.photo_url}
                  acronym={getInitials(displayName)}
                  fallbackIcon="👤"
                />
              }
              subtitle={usernameLine}
            >
              {displayName}
            </Card.Cell>
          </Card>
        </Section>
        <Section
          header="Skills overview"
          footer="Scores are mocked until the training engine syncs with real progress"
        >
          <Card type="plain">
            {SKILL_OVERVIEW.map((skill) => (
              <Card.Cell
                key={skill.name}
                subtitle={skill.label}
                after={<span style={{ fontWeight: 600 }}>{skill.score}</span>}
              >
                {skill.name}
              </Card.Cell>
            ))}
          </Card>
        </Section>
        <Section
          header="Recent activity"
          footer="Shows the latest saved sessions for this Telegram account"
        >
          <Card type="plain">{renderRecentActivity()}</Card>
        </Section>
      </List>
    </Page>
  );
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) {
    return 'n/a';
  }

  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return `${seconds}s`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}
