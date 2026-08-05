import { getWinnerPlayerNumber, getPlayerResultMessage } from './gameUtils';

function GameStats({
  stats,
  gameCompleted,
  currentTime,
  players,
  playerNumber,
  compact = false,
}) {
  const getDuration = (startTime, endTime) => {
    if (!startTime) return '0s';

    const durationMs = Math.max(0, (endTime || currentTime || Date.now()) - startTime);
    const seconds = Math.floor(durationMs / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const calcAccuracy = () => {
    if (!stats?.attempts || stats.attempts === 0) return '0%';
    const accuracy = (stats.matchedPairs / stats.attempts) * 100;
    return `${Math.round(accuracy)}%`;
  };

  const formatPlayerTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const winner = getWinnerPlayerNumber(players);
  const resultMessage = getPlayerResultMessage(players, playerNumber);
  const didWin = gameCompleted && winner === playerNumber;
  const didLose = gameCompleted && winner !== null && winner !== playerNumber;

  if (compact && !gameCompleted) {
    return (
      <div className="game-stats game-stats--compact">
        <p>Time: {getDuration(stats?.startTime, stats?.endTime)}</p>
        <p>Matched: {stats?.matchedPairs || 0}/{stats?.totalPairs || 0}</p>
        <p>Accuracy: {calcAccuracy()}</p>
      </div>
    );
  }

  return (
    <div className="game-stats">
      <h2>{gameCompleted ? 'Game Complete!' : 'Game Stats'}</h2>

      {gameCompleted ? (
        <div className="game-results">
          <h3
            className={`result-message ${didWin ? 'result-win' : didLose ? 'result-lose' : 'result-tie'}`}
          >
            {resultMessage}
          </h3>
          <div className="player-results">
            <div className="player-result">
              <h4>{players[1].name}</h4>
              <p>Score: {players[1].score}</p>
              <p>Time: {formatPlayerTime(players[1].time)}</p>
              <p>Attempts: {players[1].attempts}</p>
            </div>
            <div className="player-result">
              <h4>{players[2].name}</h4>
              <p>Score: {players[2].score}</p>
              <p>Time: {formatPlayerTime(players[2].time)}</p>
              <p>Attempts: {players[2].attempts}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p>Time: {getDuration(stats?.startTime, stats?.endTime)}</p>
          <p>Attempts: {stats?.attempts || 0}</p>
          <p>Matched: {stats?.matchedPairs || 0}/{stats?.totalPairs || 0} pairs</p>
          <p>Accuracy: {calcAccuracy()}</p>
        </>
      )}
    </div>
  );
}

export default GameStats;
