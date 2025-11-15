import { GameClient } from './GameClient';

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;

  return <GameClient slug={slug} />;
}
