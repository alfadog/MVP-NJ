export function reportGameResult(gameId: string, score: number, accuracy?: number, level?: number) {
  // TODO: connect this bridge to the backend service once endpoints are ready.
  console.log('reportGameResult', { gameId, score, accuracy, level });
}
