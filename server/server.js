import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import { getBoardMode } from '../gameConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction ? false : '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🦄', '🐝', '🦋', '🐢',
  '🐙', '🦀', '🐠', '🐬', '🦈', '🍎', '🍌', '🍇', '🍓', '🍒',
  '🌸', '🌻', '⚽', '🎸', '🎮', '🚗', '✈️', '🌙',
];

function generateRoomId() {
  let roomId = '';
  do {
    roomId = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(roomId));
  return roomId;
}

function normalizeRoomId(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateCardOrder(difficulty) {
  const { pairs } = getBoardMode(difficulty);
  const deck = EMOJIS.slice(0, pairs);
  return shuffle([...deck, ...deck]);
}

function resetRoomForNewGame(room) {
  room.gameState.cardOrder = generateCardOrder(room.difficulty);
  room.gameState.flippedCards = [];
  room.gameState.matchedCards = [];
  room.gameState.currentPlayer = 1;
  room.gameState.processing = false;
  room.gameState.started = true;

  Object.values(room.players).forEach((player) => {
    player.score = 0;
    player.attempts = 0;
    player.matchedPairs = 0;
  });
}

function buildGameStartPayload(room) {
  const board = getBoardMode(room.difficulty);
  const playerNumbers = {};
  Object.entries(room.players).forEach(([id, player]) => {
    playerNumbers[id] = player.number;
  });

  return {
    roomId: room.id,
    difficulty: room.difficulty,
    cards: buildCards(room),
    playerNumbers,
    players: getPlayersPayload(room),
    currentPlayer: room.gameState.currentPlayer,
    totalPairs: board.pairs,
    gridCols: board.cols,
    gridRows: board.rows,
  };
}

function buildCards(room) {
  return room.gameState.cardOrder.map((content, index) => ({
    id: `${index}-${content}`,
    content,
    isFlipped: room.gameState.flippedCards.includes(index),
    isMatched: room.gameState.matchedCards.includes(index),
  }));
}

function getPlayersPayload(room) {
  const payload = { 1: null, 2: null };

  Object.values(room.players).forEach((player) => {
    payload[player.number] = {
      name: player.name,
      score: player.score,
      attempts: player.attempts,
      matchedPairs: player.matchedPairs,
    };
  });

  return payload;
}

function emitTurnChanged(roomId, room) {
  io.to(roomId).emit('turnChanged', {
    currentPlayer: room.gameState.currentPlayer,
    players: getPlayersPayload(room),
    totalMatchedPairs: room.gameState.matchedCards.length / 2,
  });
}

function checkGameComplete(roomId, room) {
  const totalPairs = room.gameState.cardOrder.length / 2;
  const matchedPairs = room.gameState.matchedCards.length / 2;

  if (matchedPairs === totalPairs) {
    io.to(roomId).emit('gameComplete', {
      players: getPlayersPayload(room),
      totalMatchedPairs: matchedPairs,
    });
  }
}

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('createRoom', ({ difficulty, playerName }) => {
    const roomId = generateRoomId();
    const cardOrder = generateCardOrder(difficulty);

    rooms.set(roomId, {
      id: roomId,
      players: {
        [socket.id]: {
          name: playerName || 'Player 1',
          number: 1,
          score: 0,
          attempts: 0,
          matchedPairs: 0,
        },
      },
      difficulty,
      gameState: {
        cardOrder,
        flippedCards: [],
        matchedCards: [],
        currentPlayer: 1,
        processing: false,
        started: false,
      },
    });

    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);

    socket.emit('roomCreated', {
      roomId,
      playerNumber: 1,
      difficulty,
      players: getPlayersPayload(rooms.get(roomId)),
    });
  });

  socket.on('joinRoom', ({ roomId, difficulty, playerName }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = rooms.get(normalizedRoomId);

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (Object.keys(room.players).length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    if (room.gameState.started) {
      socket.emit('error', 'Game already started in this room');
      return;
    }

    if (room.difficulty !== difficulty) {
      socket.emit('error', 'Difficulty mismatch');
      return;
    }

    room.players[socket.id] = {
      name: playerName || 'Player 2',
      number: 2,
      score: 0,
      attempts: 0,
      matchedPairs: 0,
    };

    room.gameState.started = true;
    socket.join(normalizedRoomId);
    console.log(`Player joined room ${normalizedRoomId}: ${socket.id}`);

    const playerNumbers = {};
    Object.entries(room.players).forEach(([id, player]) => {
      playerNumbers[id] = player.number;
    });

    io.to(normalizedRoomId).emit('gameStart', buildGameStartPayload(room));
  });

  socket.on('playAgain', ({ roomId }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = rooms.get(normalizedRoomId);

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (!room.players[socket.id]) {
      socket.emit('error', 'You are not in this room');
      return;
    }

    if (Object.keys(room.players).length < 2) {
      socket.emit('error', 'Both players must be connected to play again');
      return;
    }

    resetRoomForNewGame(room);
    io.to(normalizedRoomId).emit('gameStart', buildGameStartPayload(room));
  });

  socket.on('requestGameState', ({ roomId }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = rooms.get(normalizedRoomId);
    if (!room || !room.gameState.started) return;

    socket.emit('gameStart', buildGameStartPayload(room));
  });

  socket.on('cardFlip', ({ roomId, cardIndex, playerNumber }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = rooms.get(normalizedRoomId);
    if (!room || !room.gameState.started) return;

    const player = room.players[socket.id];
    if (!player || player.number !== playerNumber) return;
    if (room.gameState.currentPlayer !== playerNumber) return;
    if (room.gameState.processing) return;
    if (room.gameState.matchedCards.includes(cardIndex)) return;
    if (room.gameState.flippedCards.includes(cardIndex)) return;
    if (room.gameState.flippedCards.length >= 2) return;

    room.gameState.flippedCards.push(cardIndex);

    io.to(normalizedRoomId).emit('cardFlipped', {
      cardIndex,
      playerNumber,
    });

    if (room.gameState.flippedCards.length === 2) {
      room.gameState.processing = true;
      player.attempts += 1;

      const [first, second] = room.gameState.flippedCards;
      const isMatch = room.gameState.cardOrder[first] === room.gameState.cardOrder[second];

      if (isMatch) {
        room.gameState.matchedCards.push(first, second);
        player.score += 1;
        player.matchedPairs += 1;
        room.gameState.flippedCards = [];
        room.gameState.processing = false;

        io.to(normalizedRoomId).emit('cardsMatched', {
          cardIndices: [first, second],
          playerNumber,
          players: getPlayersPayload(room),
          totalMatchedPairs: room.gameState.matchedCards.length / 2,
        });

        emitTurnChanged(normalizedRoomId, room);
        checkGameComplete(normalizedRoomId, room);
      } else {
        setTimeout(() => {
          const activeRoom = rooms.get(normalizedRoomId);
          if (!activeRoom) return;

          activeRoom.gameState.flippedCards = [];
          activeRoom.gameState.processing = false;
          activeRoom.gameState.currentPlayer = playerNumber === 1 ? 2 : 1;

          io.to(normalizedRoomId).emit('cardsReset', {
            cardIndices: [first, second],
          });

          emitTurnChanged(normalizedRoomId, activeRoom);
        }, 1000);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    rooms.forEach((room, roomId) => {
      if (!room.players[socket.id]) return;

      io.to(roomId).emit('playerDisconnected', {
        playerNumber: room.players[socket.id].number,
        playerName: room.players[socket.id].name,
      });

      delete room.players[socket.id];

      if (Object.keys(room.players).length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
      }
    });
  });
});

if (isProduction) {
  app.use(express.static(distPath));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('Memory Game server is running. Start the frontend with: npm run dev');
  });
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  console.log(`Server running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${ip}:${PORT}`);
});
