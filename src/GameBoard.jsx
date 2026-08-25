import { useState, useEffect, useCallback, useMemo } from 'react';
import Card from './Card';
import useGameStore from './store/gameStore';
import { playCardFlipSound, playCardMatchSound } from './sounds';
import socket, { SOCKET_URL } from './socket';
import { useBoardDimensions } from './hooks/useBoardDimensions';
import { getBoardMode } from './gameConfig.js';

function formatRoomCode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

function GameBoard({
  onGameComplete,
  totalPairs,
  playerNumber,
  roomId,
  waitingForOpponent,
  gamePayload,
  serverConnected,
}) {
  const [cards, setCards] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [gameStatus, setGameStatus] = useState(() => {
    if (waitingForOpponent) return 'waiting';
    if (gamePayload?.cards?.length) return 'playing';
    return 'connecting';
  });
  const [error, setError] = useState(null);

  const { difficulty, currentPlayer, syncFromServer, switchPlayer } = useGameStore();

  const boardMode = useMemo(() => {
    if (gamePayload?.gridCols && gamePayload?.gridRows) {
      return {
        cols: gamePayload.gridCols,
        rows: gamePayload.gridRows,
      };
    }
    const mode = getBoardMode(gamePayload?.difficulty || difficulty);
    return { cols: mode.cols, rows: mode.rows };
  }, [gamePayload, difficulty]);

  const initializeGame = useCallback((serverCards, serverState = {}) => {
    setCards(serverCards);
    setProcessing(false);
    setGameStatus('playing');
    setError(null);

    if (serverState.players || serverState.totalMatchedPairs !== undefined) {
      syncFromServer({
        players: serverState.players,
        totalMatchedPairs: serverState.totalMatchedPairs,
        currentPlayer: serverState.currentPlayer,
      });
    }
  }, [syncFromServer]);

  useEffect(() => {
    if (waitingForOpponent) {
      setGameStatus('waiting');
      return;
    }

    if (gamePayload?.cards?.length) {
      initializeGame(gamePayload.cards, {
        players: gamePayload.players,
        totalMatchedPairs: 0,
        currentPlayer: gamePayload.currentPlayer ?? 1,
      });
    }
  }, [waitingForOpponent, gamePayload, initializeGame]);

  useEffect(() => {
    if (waitingForOpponent || gamePayload?.cards?.length || !roomId) return undefined;

    if (socket.connected) {
      socket.emit('requestGameState', { roomId });
    }

    const timeout = setTimeout(() => {
      setGameStatus((current) => {
        if (current === 'connecting') {
          setError('Game data did not arrive. Check that the server is running, then refresh.');
        }
        return current;
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [waitingForOpponent, gamePayload, roomId]);

  useEffect(() => {
    const handleGameStart = (data) => {
      if (data.roomId !== roomId) return;

      initializeGame(data.cards, {
        players: data.players,
        totalMatchedPairs: 0,
        currentPlayer: data.currentPlayer ?? 1,
      });
    };

    const handleCardFlipped = ({ cardIndex }) => {
      playCardFlipSound();
      setCards((prev) =>
        prev.map((card, index) =>
          index === cardIndex ? { ...card, isFlipped: true } : card,
        ),
      );
    };

    const handleCardsMatched = ({ cardIndices, players, totalMatchedPairs }) => {
      playCardMatchSound();
      setCards((prev) =>
        prev.map((card, index) =>
          cardIndices.includes(index)
            ? { ...card, isFlipped: true, isMatched: true }
            : card,
        ),
      );
      setProcessing(false);
      syncFromServer({ players, totalMatchedPairs });
    };

    const handleCardsReset = ({ cardIndices }) => {
      setCards((prev) =>
        prev.map((card, index) =>
          cardIndices.includes(index) ? { ...card, isFlipped: false } : card,
        ),
      );
      setProcessing(false);
    };

    const handleTurnChanged = ({ currentPlayer: nextPlayer, players, totalMatchedPairs }) => {
      switchPlayer(nextPlayer);
      syncFromServer({ players, totalMatchedPairs, currentPlayer: nextPlayer });
    };

    const handleGameComplete = ({ totalMatchedPairs }) => {
      syncFromServer({ totalMatchedPairs });
      onGameComplete();
    };

    const handlePlayerDisconnected = ({ playerName }) => {
      setError(`${playerName || 'Opponent'} disconnected. Refresh to start again.`);
    };

    const handleSocketError = (message) => {
      setError(typeof message === 'string' ? message : 'Connection error');
    };

    socket.on('gameStart', handleGameStart);
    socket.on('cardFlipped', handleCardFlipped);
    socket.on('cardsMatched', handleCardsMatched);
    socket.on('cardsReset', handleCardsReset);
    socket.on('turnChanged', handleTurnChanged);
    socket.on('gameComplete', handleGameComplete);
    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('gameStart', handleGameStart);
      socket.off('cardFlipped', handleCardFlipped);
      socket.off('cardsMatched', handleCardsMatched);
      socket.off('cardsReset', handleCardsReset);
      socket.off('turnChanged', handleTurnChanged);
      socket.off('gameComplete', handleGameComplete);
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('error', handleSocketError);
    };
  }, [
    roomId,
    initializeGame,
    syncFromServer,
    switchPlayer,
    onGameComplete,
  ]);

  const handleCardClick = (cardIndex) => {
    if (
      gameStatus !== 'playing' ||
      processing ||
      currentPlayer !== playerNumber ||
      cards[cardIndex]?.isMatched ||
      cards[cardIndex]?.isFlipped
    ) {
      return;
    }

    const flippedCount = cards.filter((card) => card.isFlipped && !card.isMatched).length;
    if (flippedCount >= 2) return;

    if (flippedCount === 1) {
      setProcessing(true);
    }

    socket.emit('cardFlip', { roomId, cardIndex, playerNumber });
  };

  const { cols: gridCols, rows: gridRows } = boardMode;
  const isBoardActive = gameStatus === 'playing';
  const { containerRef, dimensions } = useBoardDimensions(gridCols, gridRows, isBoardActive);

  const boardStyle = useMemo(() => {
    const width = dimensions.width || gridCols * 40;
    const height = dimensions.height || gridRows * 40;
    const cellSize = dimensions.cellSize || 40;

    return {
      width: `${width}px`,
      height: `${height}px`,
      '--grid-cols': gridCols,
      '--grid-rows': gridRows,
      '--cell-size': `${cellSize}px`,
    };
  }, [dimensions, gridCols, gridRows]);

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  if (gameStatus === 'connecting') {
    return (
      <div className="board-shell">
        <div className="status-message">
          <p>Connecting to server...</p>
          {!serverConnected && (
            <p className="join-help">
              Start the server with <strong>npm run server</strong> at {SOCKET_URL}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <div className="board-shell">
        <div className="waiting-screen">
          <h2>Waiting for Player 2</h2>
          <p>Share this Room ID with your friend:</p>
          <p className="room-code">{formatRoomCode(roomId)}</p>
          <p>You are Player {playerNumber}</p>
          <p className="join-help">
            Open the same site on another device or browser window and join with this code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-shell">
      <div className="board-panel">
        <div className="game-header">
          <div className={`player-turn ${currentPlayer === playerNumber ? 'active' : ''}`}>
            {currentPlayer === playerNumber ? 'Your turn!' : "Opponent's turn"}
          </div>
          <div className="game-progress">
            Matched: {cards.filter((card) => card.isMatched).length / 2} / {totalPairs}
          </div>
        </div>

        <div className="board-grid-wrap" ref={containerRef}>
          {cards.length > 0 && (
            <div className="board-grid" style={boardStyle}>
              {cards.map((card, index) => (
                <Card
                  key={card.id}
                  id={index}
                  content={card.content}
                  isFlipped={card.isFlipped}
                  isMatched={card.isMatched}
                  onClick={handleCardClick}
                  disabled={
                    processing ||
                    card.isMatched ||
                    currentPlayer !== playerNumber ||
                    (cards.filter((item) => item.isFlipped && !item.isMatched).length >= 2 &&
                      !card.isFlipped)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
