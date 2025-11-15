'use client';

import { initDataState as _initDataState, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Card, List, Section } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

import {
  GAME_SKILL_LABELS,
  GAME_SKILL_ORDER,
  games,
  type GameSkillType,
} from '@/games/config';
import { Page } from '@/components/Page';

interface RecentSession {
  id: string;
  gameId: string;
  skillType: GameSkillType;
  score: number;
  level?: number | null;
  durationMs?: number | null;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

interface SkillOverviewItem {
  skillType: GameSkillType;
  averageScore: number;
  bestScore: number;
  lastScore: number;
  sessionsCount: number;
  label: string;
}

interface SkillOverviewResponseItem {
  skillType: string;
  averageScore: number;
  bestScore: number;
  lastScore: number;
  sessionsCount: number;
  label: string;
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
  const [skillOverview, setSkillOverview] = useState<SkillOverviewItem[] | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRecentSessions(null);
      setRecentLoading(false);
      setRecentError(null);
      setSkillOverview(null);
      setSkillsLoading(false);
      setSkillsError(null);
      return;
    }

    let cancelled = false;
    const fetchSessions = async () => {
      setRecentLoading(true);
      setRecentError(null);
      setSkillsLoading(true);
      setSkillsError(null);

      try {
        const [recentResponse, overviewResponse] = await Promise.all([
          fetch(`/api/game-sessions/recent?userId=${encodeURIComponent(userId)}`),
          fetch(
            `/api/game-sessions/skills-overview?userId=${encodeURIComponent(
              userId,
            )}&limit=50`,
          ),
        ]);

        if (!cancelled) {
          if (recentResponse.ok) {
            const data: RecentSession[] = await recentResponse.json();
            setRecentSessions(data);
            setRecentError(null);
          } else {
            setRecentSessions(null);
            setRecentError('Unable to load recent sessions');
          }

          if (overviewResponse.ok) {
            const raw: SkillOverviewResponseItem[] = await overviewResponse.json();
            const parsed = raw
              .map((item) => {
                if (!isGameSkillType(item.skillType)) {
                  return null;
                }

                return {
                  skillType: item.skillType,
                  averageScore: item.averageScore,
                  bestScore: item.bestScore,
                  lastScore: item.lastScore,
                  sessionsCount: item.sessionsCount,
                  label: item.label,
                } satisfies SkillOverviewItem;
              })
              .filter((item): item is SkillOverviewItem => Boolean(item));
            setSkillOverview(parsed);
            setSkillsError(null);
          } else {
            setSkillOverview(null);
            setSkillsError('Unable to load skills overview');
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch profile data', error);
          setRecentError('Unable to load recent sessions');
          setSkillsError('Unable to load skills overview');
        }
      } finally {
        if (!cancelled) {
          setRecentLoading(false);
          setSkillsLoading(false);
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
      const skillLabel = GAME_SKILL_LABELS[session.skillType];
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

  const renderSkillsOverview = () => {
    if (!userId) {
      return (
        <Card.Cell subtitle="Play from inside Telegram to sync your skills.">
          No Telegram user detected
        </Card.Cell>
      );
    }

    if (skillsLoading) {
      return <Card.Cell>Calculating skills overview…</Card.Cell>;
    }

    if (skillsError) {
      return (
        <Card.Cell subtitle="Try again after refreshing the Mini App.">
          {skillsError}
        </Card.Cell>
      );
    }

    if (!skillOverview?.length) {
      return (
        <Card.Cell subtitle="Play a few rounds to unlock your skill profile.">
          No data yet
        </Card.Cell>
      );
    }

    return skillOverview.map((item) => {
      const skillLabel = GAME_SKILL_LABELS[item.skillType];
      return (
        <Card.Cell
          key={item.skillType}
          subtitle={`${item.label} • best ${item.bestScore} • ${item.sessionsCount} sessions`}
          after={<span style={{ fontWeight: 600 }}>{item.averageScore}</span>}
        >
          {skillLabel}
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
                  size={48}
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
          footer="Scores reflect your recent training history by skill type."
        >
          <Card type="plain">{renderSkillsOverview()}</Card>
        </Section>
        <Section
          header="Recent activity"
          footer="Shows your latest saved sessions for this Telegram account."
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

function isGameSkillType(value: string): value is GameSkillType {
  return (GAME_SKILL_ORDER as readonly string[]).includes(value);
}
