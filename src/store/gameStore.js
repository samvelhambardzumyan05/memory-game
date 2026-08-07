import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getBoardMode } from './gameConfig.js';

const useGameStore = create(
  persist(
    (set, get) => ({
      difficulty: '6x6',
      gameStarted: false,
      gameCompleted: false,
      currentPlayer: 1,
      playerNumber: null,
      players: {
        1: { 
          name: 'Player 1', 
          score: 0,
          time: 0,
          attempts: 0,
          color: '#3498db'
        },
        2: { 
          name: 'Player 2', 
          score: 0,
          time: 0,
          attempts: 0,
          color: '#e74c3c' 
        }
      },
      stats: {
        startTime: null,
        endTime: null,
        attempts: 0,
        matchedPairs: 0,
        totalPairs: 18,
      },
      timer: null,

      setPlayerNumber: (number) => set({ playerNumber: number }),
      setDifficulty: (newDifficulty) => {
        const { pairs } = getBoardMode(newDifficulty);
        set({
          difficulty: newDifficulty,
          stats: {
            ...get().stats,
            totalPairs: pairs,
            matchedPairs: 0,
          },
        });
      },
      setPlayerNames: (player1Name, player2Name) => set({
        players: {
          1: { ...get().players[1], name: player1Name },
          2: { ...get().players[2], name: player2Name }
        }
      }),
      setPlayerColor: (playerNum, color) => set({
        players: {
          ...get().players,
          [playerNum]: { ...get().players[playerNum], color }
        }
      }),
      startGame: (startingPlayer = 1, { startTimer = true } = {}) => {
        if (get().timer) clearInterval(get().timer);

        const baseState = {
          gameStarted: true,
          gameCompleted: false,
          currentPlayer: startingPlayer,
          players: {
            1: { ...get().players[1], score: 0, time: 0, attempts: 0 },
            2: { ...get().players[2], score: 0, time: 0, attempts: 0 },
          },
          stats: {
            ...get().stats,
            startTime: startTimer ? Date.now() : null,
            endTime: null,
            attempts: 0,
            matchedPairs: 0,
          },
          timer: null,
        };

        if (startTimer) {
          baseState.timer = setInterval(() => {
            set((state) => ({
              players: {
                ...state.players,
                [state.currentPlayer]: {
                  ...state.players[state.currentPlayer],
                  time: state.players[state.currentPlayer].time + 1,
                },
              },
            }));
          }, 1000);
        }

        set(baseState);
      },
      switchPlayer: (newPlayer) => set({ currentPlayer: newPlayer }),
      syncFromServer: ({ players, totalMatchedPairs, currentPlayer }) => set((state) => ({
        currentPlayer: currentPlayer ?? state.currentPlayer,
        players: {
          1: {
            ...state.players[1],
            name: players?.[1]?.name ?? state.players[1].name,
            score: players?.[1]?.score ?? state.players[1].score,
            attempts: players?.[1]?.attempts ?? state.players[1].attempts,
          },
          2: {
            ...state.players[2],
            name: players?.[2]?.name ?? state.players[2].name,
            score: players?.[2]?.score ?? state.players[2].score,
            attempts: players?.[2]?.attempts ?? state.players[2].attempts,
          },
        },
        stats: {
          ...state.stats,
          matchedPairs: totalMatchedPairs ?? state.stats.matchedPairs,
          attempts: (players?.[1]?.attempts ?? 0) + (players?.[2]?.attempts ?? 0),
        },
      })),
      completeGame: () => {
        const state = get();
        if (state.timer) clearInterval(state.timer);
        set({
          gameCompleted: true,
          stats: {
            ...state.stats,
            endTime: Date.now(),
          },
          timer: null
        });
      },
      resetGame: () => {
        const state = get();
        if (state.timer) clearInterval(state.timer);
        set({
          gameStarted: false,
          gameCompleted: false,
          currentPlayer: 1,
          players: {
            1: { ...state.players[1], score: 0, time: 0, attempts: 0 },
            2: { ...state.players[2], score: 0, time: 0, attempts: 0 },
          },
          stats: {
            startTime: null,
            endTime: null,
            attempts: 0,
            matchedPairs: 0,
            totalPairs: state.stats.totalPairs,
          },
          timer: null,
        });
      },
      prepareRematch: (startingPlayer = 1) => {
        if (get().timer) clearInterval(get().timer);
        set({
          gameStarted: true,
          gameCompleted: false,
          currentPlayer: startingPlayer,
          players: {
            1: { ...get().players[1], score: 0, time: 0, attempts: 0 },
            2: { ...get().players[2], score: 0, time: 0, attempts: 0 },
          },
          stats: {
            ...get().stats,
            startTime: Date.now(),
            endTime: null,
            attempts: 0,
            matchedPairs: 0,
          },
          timer: setInterval(() => {
            set((state) => ({
              players: {
                ...state.players,
                [state.currentPlayer]: {
                  ...state.players[state.currentPlayer],
                  time: state.players[state.currentPlayer].time + 1,
                },
              },
            }));
          }, 1000),
        });
      },
    }),
    {
      name: 'memory-game-storage',
      partialize: (state) => ({
        difficulty: state.difficulty,
        players: {
          1: { name: state.players[1].name, color: state.players[1].color },
          2: { name: state.players[2].name, color: state.players[2].color }
        }
      }),
    }
  )
);

export default useGameStore;