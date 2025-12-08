import type { GameDefinition } from './config';

/**
 * Filter games to only include those with component implementations
 */
export function getAvailableGames(games: GameDefinition[]): GameDefinition[] {
  return games.filter((game) => game.component !== undefined);
}
