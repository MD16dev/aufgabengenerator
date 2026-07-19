/**
 * Standard Elo rating calculation for duels.
 */

const K_FACTOR = 32;

/**
 * Compute the new Elo ratings for a winner and a loser.
 * Returns the updated ratings for both players.
 */
export function computeElo(
  winnerElo: number,
  loserElo: number
): { winnerElo: number; loserElo: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;

  const newWinner = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const newLoser = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

  return { winnerElo: newWinner, loserElo: newLoser };
}
