export function getWinnerPlayerNumber(players) {
  if (!players?.[1] || !players?.[2]) return null;

  const player1 = players[1];
  const player2 = players[2];

  if (player1.score > player2.score) return 1;
  if (player2.score > player1.score) return 2;

  if (player1.attempts < player2.attempts) return 1;
  if (player2.attempts < player1.attempts) return 2;

  if (player1.time < player2.time) return 1;
  if (player2.time < player1.time) return 2;

  return null;
}

export function getPlayerResultMessage(players, playerNumber) {
  const winner = getWinnerPlayerNumber(players);

  if (winner === null) {
    return "It's a tie!";
  }

  if (winner === playerNumber) {
    return 'Congratulations! You won!';
  }

  return 'You lost. Better luck next time!';
}
