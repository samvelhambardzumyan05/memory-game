import { useState, useEffect } from 'react';
import socket from './socket';

function StartScreen({ onStart, currentDifficulty, serverConnected }) {
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('');
  const [difficulty, setDifficulty] = useState(currentDifficulty);
  const [playerName, setPlayerName] = useState('Player');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.origin);
  }, []);

  const createRoom = () => {
    if (!serverConnected) {
      setStatus('Server is not connected. Run npm run server first.');
      return;
    }
    if (!playerName.trim()) {
      setStatus('Please enter your name first.');
      return;
    }
    socket.emit('createRoom', { difficulty, playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!serverConnected) {
      setStatus('Server is not connected. Run npm run server first.');
      return;
    }
    const normalizedRoomId = roomId.trim().toUpperCase();
    if (!playerName.trim()) {
      setStatus('Please enter your name first.');
      return;
    }
    if (!normalizedRoomId) {
      setStatus('Please enter a Room ID.');
      return;
    }
    socket.emit('joinRoom', {
      roomId: normalizedRoomId,
      difficulty,
      playerName: playerName.trim(),
    });
  };

  useEffect(() => {
    const handleRoomCreated = ({ roomId: createdRoomId, difficulty: roomDifficulty, players }) => {
      setRoomId(createdRoomId);
      setStatus(`Room ${createdRoomId} created. Waiting for Player 2...`);
      onStart({
        roomId: createdRoomId,
        difficulty: roomDifficulty,
        playerNumber: 1,
        waitingForOpponent: true,
        players,
      });
    };

    const handleError = (message) => {
      setStatus(`Error: ${message}`);
    };

    socket.on('roomCreated', handleRoomCreated);
    socket.on('error', handleError);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('error', handleError);
    };
  }, [onStart]);

  return (
    <div className="start-screen">
      <div className="player-settings">
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength="10"
        />
      </div>

      <div className="difficulty-selector">
        <label htmlFor="difficulty">Difficulty:</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy (4×4)</option>
          <option value="medium">Medium (6×6)</option>
          <option value="hard">Hard (8×8)</option>
        </select>
      </div>

      <div className="button-group">
        <button type="button" className="create-button" onClick={createRoom}>
          Create Room (Player 1)
        </button>
      </div>

      <div className="join-section">
        <input
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
        <button type="button" className="join-button" onClick={joinRoom}>
          Join Room (Player 2)
        </button>
      </div>

      {shareUrl && (
        <p className="join-help">
          Other devices should open <strong>{shareUrl}</strong> to join your game.
        </p>
      )}

      <p className="status-message">{status}</p>
    </div>
  );
}

export default StartScreen;
