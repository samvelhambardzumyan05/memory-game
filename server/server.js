import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';

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

const PAIR_COUNTS = { easy: 8, medium: 18, hard: 32 };

const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🦄', '🐝', '🦋', '🐢',
  '🐙', '🦀', '🐠', '🐬', '🦈', '🍎', '🍌', '🍇', '🍓', '🍒',
  '🌸', '🌻',
];

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
  const pairCount = PAIR_COUNTS[difficulty] || PAIR_COUNTS.medium;
  const pairs = EMOJIS.slice(0, pairCount);
  return shuffle([...pairs, ...pairs]);
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
    const normalizedRoomId = roomId.trim().toUpperCase();
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

    io.to(normalizedRoomId).emit('gameStart', {
      roomId: normalizedRoomId,
      difficulty: room.difficulty,
      cards: buildCards(room),
      playerNumbers,
      players: getPlayersPayload(room),
      currentPlayer: room.gameState.currentPlayer,
      totalPairs: room.gameState.cardOrder.length / 2,
    });
  });

  socket.on('requestGameState', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.started) return;

    const playerNumbers = {};
    Object.entries(room.players).forEach(([id, player]) => {
      playerNumbers[id] = player.number;
    });

    socket.emit('gameStart', {
      roomId,
      difficulty: room.difficulty,
      cards: buildCards(room),
      playerNumbers,
      players: getPlayersPayload(room),
      currentPlayer: room.gameState.currentPlayer,
      totalPairs: room.gameState.cardOrder.length / 2,
    });
  });

  socket.on('cardFlip', ({ roomId, cardIndex, playerNumber }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.started) return;

    const player = room.players[socket.id];
    if (!player || player.number !== playerNumber) return;
    if (room.gameState.currentPlayer !== playerNumber) return;
    if (room.gameState.processing) return;
    if (room.gameState.matchedCards.includes(cardIndex)) return;
    if (room.gameState.flippedCards.includes(cardIndex)) return;
    if (room.gameState.flippedCards.length >= 2) return;

    room.gameState.flippedCards.push(cardIndex);

    io.to(roomId).emit('cardFlipped', {
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

        io.to(roomId).emit('cardsMatched', {
          cardIndices: [first, second],
          playerNumber,
          players: getPlayersPayload(room),
          totalMatchedPairs: room.gameState.matchedCards.length / 2,
        });

        emitTurnChanged(roomId, room);
        checkGameComplete(roomId, room);
      } else {
        setTimeout(() => {
          const activeRoom = rooms.get(roomId);
          if (!activeRoom) return;

          activeRoom.gameState.flippedCards = [];
          activeRoom.gameState.processing = false;
          activeRoom.gameState.currentPlayer = playerNumber === 1 ? 2 : 1;

          io.to(roomId).emit('cardsReset', {
            cardIndices: [first, second],
          });

          emitTurnChanged(roomId, activeRoom);
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
