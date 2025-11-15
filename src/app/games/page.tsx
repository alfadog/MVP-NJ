'use client';

import { Card, Cell, List, Section } from '@telegram-apps/telegram-ui';

import { Link } from '@/components/Link/Link';
import { Page } from '@/components/Page';
import {
  GAME_SKILL_LABELS,
  GAME_SKILL_ORDER,
  type GameSkillType,
  games,
} from '@/games/config';

const SKILL_DESCRIPTIONS: Record<GameSkillType, string> = {
  MEMORY: 'Exercises that boost recall and working memory.',
  SPEED: 'Quick reactions and processing challenges.',
  ATTENTION: 'Focus drills that cut through distractions.',
  FLEXIBILITY: 'Context switches and rule changes to adapt fast.',
  MATH: 'Logic and number puzzles to sharpen reasoning.',
};

export default function GamesCatalogPage() {
  return (
    <Page>
      <List>
        <Section
          header="Training catalog"
          footer="Pick a skill lane to jump into its bite-sized drills"
        >
          <Card type="plain">
            <Card.Cell subtitle="Grouped by the five skills we track across every session">
              Choose a challenge
            </Card.Cell>
          </Card>
        </Section>
        {GAME_SKILL_ORDER.map((skillType) => {
          const gamesForSkill = games.filter((game) => game.skillType === skillType);

          return (
            <Section
              key={skillType}
              header={GAME_SKILL_LABELS[skillType]}
              footer={SKILL_DESCRIPTIONS[skillType]}
            >
              <Card type="plain">
                {gamesForSkill.length ? (
                  gamesForSkill.map((game) => (
                    <Link key={game.id} href={`/games/${game.slug}`}>
                      <Cell subtitle={game.shortDescription}>{game.title}</Cell>
                    </Link>
                  ))
                ) : (
                  <Card.Cell subtitle="We are designing more drills for this skill lane.">
                    Coming soon
                  </Card.Cell>
                )}
              </Card>
            </Section>
          );
        })}
      </List>
    </Page>
  );
}
