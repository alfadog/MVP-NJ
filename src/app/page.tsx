'use client';

import {
  Button,
  Card,
  Section,
  Cell,
  Image,
  List,
} from '@telegram-apps/telegram-ui';
import { useTranslations } from 'next-intl';

import { Link } from '@/components/Link/Link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher/LocaleSwitcher';
import { Page } from '@/components/Page';

import tonSvg from './_assets/ton.svg';

export default function Home() {
  const t = useTranslations('i18n');

  return (
    <Page back={false}>
      <List>
        <Section
          header="Cognitive training"
          footer="Daily sessions blend memory, speed, attention, flexibility, and logic drills"
        >
          <Card type="plain">
            <Card.Cell subtitle="Sharpen your brain with short sessions that stay native to Telegram.">
              Guided exercises in one tap
            </Card.Cell>
            <Card.Cell>
              <Link href="/games" style={{ display: 'block' }}>
                <Button size="l" mode="filled" stretched>
                  Go to training
                </Button>
              </Link>
            </Card.Cell>
          </Card>
        </Section>
        <Section header="Account" footer="Review your progress and skills">
          <Link href="/profile">
            <Cell subtitle="Skills overview and Telegram identity">Profile</Cell>
          </Link>
        </Section>
        <Section
          header="Features"
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
        >
          <Link href="/ton-connect">
            <Cell
              before={
                <Image
                  src={tonSvg.src}
                  style={{ backgroundColor: '#007AFF' }}
                  alt="TON Logo"
                />
              }
              subtitle="Connect your TON wallet"
            >
              TON Connect
            </Cell>
          </Link>
        </Section>
        <Section
          header="Application Launch Data"
          footer="These pages help developer to learn more about current launch information"
        >
          <Link href="/init-data">
            <Cell subtitle="User data, chat information, technical data">
              Init Data
            </Cell>
          </Link>
          <Link href="/launch-params">
            <Cell subtitle="Platform identifier, Mini Apps version, etc.">
              Launch Parameters
            </Cell>
          </Link>
          <Link href="/theme-params">
            <Cell subtitle="Telegram application palette information">
              Theme Parameters
            </Cell>
          </Link>
        </Section>
        <Section header={t('header')} footer={t('footer')}>
          <LocaleSwitcher />
        </Section>
        <Section
          header="TelegramUI preview"
          footer="All surfaces, spacing, and typography mirror the Telegram Mini Apps UI Kit"
        >
          <Card type="ambient">
            <Card.Cell subtitle="Design tokens are inherited from the Telegram runtime">
              Native look & feel
            </Card.Cell>
            <Card.Cell subtitle="Buttons use TelegramUI modes, typography, and spacing">
              <Button size="m" mode="filled" stretched>
                Primary action
              </Button>
            </Card.Cell>
          </Card>
        </Section>
      </List>
    </Page>
  );
}
