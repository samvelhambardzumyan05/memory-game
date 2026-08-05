import { useState, useEffect, useCallback } from 'react';
import GameBoard from './GameBoard';
import GameStats from './GameStats';
import useGameStore from './store/gameStore';
import StartScreen from './StartScreen';
import Confetti from './Confetti';
import { playWinSound, initAudio } from './sounds';
import socket, { SOCKET_URL } from './socket';
import { getWinnerPlayerNumber } from './gameUtils';
import './App.css';

function FormatTime({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function applyGameStartData(data, {
  setRoomId,
  setWaitingForOpponent,
  setGamePayload,
  setPlayerNumber,
  setDifficulty,
  setPlayerNames,
  syncFromServer,
  startGame,
  setGameKey,
}) {
  const playerNum = data.playerNumbers[socket.id];
  if (!playerNum) return;

  setRoomId(data.roomId);
  setWaitingForOpponent(false);
  setGamePayload(data);
  setPlayerNumber(playerNum);
  setDifficulty(data.difficulty);

  if (data.players) {
    setPlayerNames(
      data.players?.[1]?.name || 'Player 1',
      data.players?.[2]?.name || 'Player 2',
    );
    syncFromServer({
      players: data.players,
      totalMatchedPairs: 0,
      currentPlayer: data.currentPlayer ?? 1,
    });
  }

  startGame(playerNum, { startTimer: true });
  setGameKey((prev) => prev + 1);
}

function App() {
  const {
    difficulty,
    gameStarted,
    players,
    currentPlayer,
    playerNumber,
    stats,
    setDifficulty,
    setPlayerNumber,
    setPlayerNames,
    syncFromServer,
    startGame,
    resetGame,
    completeGame,
    timer,
  } = useGameStore();

  const [gameKey, setGameKey] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [gamePayload, setGamePayload] = useState(null);
  const [serverConnected, setServerConnected] = useState(socket.connected);

  useEffect(() => {
    try {
      initAudio();
      const unsubHydrate = useGameStore.persist.onFinishHydration(() => {
        setIsHydrated(true);
      });

      if (useGameStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }

      return () => {
        unsubHydrate?.();
      };
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize game. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    const onConnect = () => setServerConnected(true);
    const onDisconnect = () => setServerConnected(false);
    const onConnectError = () => setServerConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  useEffect(() => {
    const handleGameStart = (data) => {
      applyGameStartData(data, {
        setRoomId,
        setWaitingForOpponent,
        setGamePayload,
        setPlayerNumber,
        setDifficulty,
        setPlayerNames,
        syncFromServer,
        startGame,
        setGameKey,
      });
    };

    socket.on('gameStart', handleGameStart);
    return () => socket.off('gameStart', handleGameStart);
  }, [setDifficulty, setPlayerNumber, setPlayerNames, syncFromServer, startGame]);

  useEffect(() => {
    const gameComplete =
      stats?.matchedPairs === stats?.totalPairs &&
      stats?.totalPairs > 0 &&
      !waitingForOpponent;

    if (!gameComplete) {
      setShowConfetti(false);
      return;
    }

    const winner = getWinnerPlayerNumber(players);
    const currentPlayerWon = winner === playerNumber;

    setShowConfetti(currentPlayerWon);
    if (currentPlayerWon) {
      playWinSound();
    }
  }, [stats?.matchedPairs, stats?.totalPairs, waitingForOpponent, players, playerNumber]);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const handleStartGame = useCallback(({
    roomId: nextRoomId,
    difficulty: selectedDifficulty,
    playerNumber: playerNum,
    waitingForOpponent: isWaiting,
    players: serverPlayers,
  }) => {
    try {
      setRoomId(nextRoomId);
      setWaitingForOpponent(Boolean(isWaiting));
      setPlayerNumber(playerNum);
      setDifficulty(selectedDifficulty);
      setGamePayload(null);

      if (serverPlayers?.[1]?.name || serverPlayers?.[2]?.name) {
        setPlayerNames(
          serverPlayers?.[1]?.name || 'Player 1',
          serverPlayers?.[2]?.name || 'Player 2',
        );
        syncFromServer({ players: serverPlayers, totalMatchedPairs: 0 });
      }

      startGame(playerNum, { startTimer: !isWaiting });
    } catch (err) {
      console.error('Game start error:', err);
      setError('Failed to start game. Please try again.');
    }
  }, [setDifficulty, setPlayerNumber, setPlayerNames, syncFromServer, startGame]);

  if (error) {
    return (
      <div className="app">
        <h1>Memory Card Game</h1>
        <div className="error-state">{error}</div>
        <button type="button" onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="app">
        <h1>Memory Card Game</h1>
        <div className="loading-state">Loading game data...</div>
      </div>
    );
  }

  const gameComplete =
    stats?.matchedPairs === stats?.totalPairs &&
    stats?.totalPairs > 0 &&
    !waitingForOpponent;

  return (
    <div className={`app ${gameStarted ? 'app--playing' : ''} ${gameComplete ? 'app--complete' : ''}`}>
      <header className="app-header">
        <h1>Memory Card Game</h1>
      </header>

      {!serverConnected && (
        <div className="error-state">
          Cannot connect to game server at {SOCKET_URL}.
          Open a terminal in the project folder and run <strong>npm run server</strong>, then refresh.
        </div>
      )}

      {!gameStarted ? (
        <div className="app-surface">
          <StartScreen
            onStart={handleStartGame}
            currentDifficulty={difficulty}
            serverConnected={serverConnected}
          />
        </div>
      ) : (
        <div className="app-surface game-shell">
          <div className="player-scoreboard">
            {players?.[1] && (
              <div
                className={`player-chip ${currentPlayer === 1 ? 'player-chip--active' : ''}`}
                style={{ '--player-color': players[1].color }}
              >
                <span className="player-chip__label">Player 1</span>
                <span className="player-chip__name">{players[1].name}</span>
                <span className="player-chip__stats">
                  {players[1].score} pts · <FormatTime seconds={players[1].time} /> · {players[1].attempts} tries
                </span>
              </div>
            )}

            {players?.[2] && (
              <div
                className={`player-chip ${currentPlayer === 2 ? 'player-chip--active' : ''}`}
                style={{ '--player-color': players[2].color }}
              >
                <span className="player-chip__label">Player 2</span>
                <span className="player-chip__name">{players[2].name}</span>
                <span className="player-chip__stats">
                  {players[2].score} pts · <FormatTime seconds={players[2].time} /> · {players[2].attempts} tries
                </span>
              </div>
            )}
          </div>

          {!waitingForOpponent && gameComplete && (
            <GameStats
              stats={stats}
              gameCompleted
              currentTime={Date.now()}
              players={players}
              playerNumber={playerNumber}
            />
          )}

          {showConfetti && <Confetti />}

          <GameBoard
            key={gameKey}
            onGameComplete={completeGame}
            totalPairs={stats?.totalPairs}
            roomId={roomId}
            playerNumber={playerNumber}
            waitingForOpponent={waitingForOpponent}
            gamePayload={gamePayload}
            serverConnected={serverConnected}
          />

          {gameComplete && (
            <div className="play-again-wrap">
              <button
                type="button"
                className="play-again-button"
                onClick={() => {
                  resetGame();
                  setRoomId(null);
                  setWaitingForOpponent(false);
                  setGamePayload(null);
                  setGameKey((prev) => prev + 1);
                }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
