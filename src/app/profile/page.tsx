'use client';

import { initDataState as _initDataState, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Card, Cell, List, Section } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

const SKILL_OVERVIEW = [
  { name: 'Memory', score: 128, label: 'Strong' },
  { name: 'Speed', score: 112, label: 'Steady' },
  { name: 'Attention / Focus', score: 95, label: 'Focused' },
  { name: 'Flexibility', score: 88, label: 'Improving' },
  { name: 'Math / Logic', score: 102, label: 'Balanced' },
];

export default function ProfilePage() {
  const initDataState = useSignal(_initDataState);
  const user = initDataState?.user;

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ')
    : 'Telegram User';
  const usernameLine = user?.username ? `@${user.username}` : 'Mini App tester';

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
      </List>
    </Page>
  );
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
