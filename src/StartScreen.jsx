import { useState, useEffect } from 'react';
import socket from './socket';
import { getModeOptions } from './gameConfig.js';

function formatRoomCode(code) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

function StartScreen({ onStart, currentDifficulty, serverConnected }) {
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('');
  const [difficulty, setDifficulty] = useState(currentDifficulty);
  const [playerName, setPlayerName] = useState('Player');
  const [shareUrl, setShareUrl] = useState('');
  const modeOptions = getModeOptions();

  useEffect(() => {
    setShareUrl(window.location.origin);
  }, []);

  useEffect(() => {
    setDifficulty(currentDifficulty);
  }, [currentDifficulty]);

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
    const normalizedRoomId = roomId.replace(/\D/g, '');
    if (!playerName.trim()) {
      setStatus('Please enter your name first.');
      return;
    }
    if (normalizedRoomId.length !== 6) {
      setStatus('Please enter the full 6-digit Room ID.');
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
      setStatus(`Room ${formatRoomCode(createdRoomId)} created. Waiting for Player 2...`);
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
        <label htmlFor="difficulty">Board size:</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {modeOptions.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      <div className="button-group">
        <button type="button" className="create-button" onClick={createRoom}>
          Create Room (Player 1)
        </button>
      </div>

      <div className="join-section">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9 ]*"
          placeholder="Enter 6-digit Room ID"
          value={roomId}
          maxLength={7}
          onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
