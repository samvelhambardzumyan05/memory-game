# Memory Card Game

A 2-player online memory card game built with React and Socket.io.

## Run locally (same computer)

Open two terminals in this folder:

```bash
# Terminal 1 - backend
npm run server

# Terminal 2 - frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Play on two devices (same Wi‑Fi)

1. Start the server and frontend on the host computer (steps above).
2. On the host, note the **Network** URL shown in the terminal when you run `npm run dev` (for example `http://192.168.1.10:5173`).
3. **Player 1** opens that URL on the host device → enters name → **Create Room** → shares the Room ID.
4. **Player 2** opens the same URL on another phone/laptop → enters name → **Join Room** with the Room ID.

Both players must use the same website address so the game connects to the same server.

## How it works

- Player 1 creates a room and waits for Player 2.
- Player 2 joins with the 6-character Room ID.
- The server shuffles cards and keeps both players in sync.
- Take turns flipping cards. Match pairs to score points.

## Difficulty

- Easy: 4×4 (8 pairs)
- Medium: 6×6 (18 pairs)
- Hard: 8×8 (32 pairs)
