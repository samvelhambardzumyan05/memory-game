export const BOARD_MODES = {
  '4x4': { cols: 4, rows: 4, pairs: 8, label: 'Easy (4×4)' },
  '5x4': { cols: 5, rows: 4, pairs: 10, label: 'Medium (5×4)' },
  '6x4': { cols: 6, rows: 4, pairs: 12, label: 'Medium (6×4)' },
  '6x6': { cols: 6, rows: 6, pairs: 18, label: 'Hard (6×6)' },
  '6x8': { cols: 6, rows: 8, pairs: 24, label: 'Expert (6×8)' },
};

export function getBoardMode(mode) {
  return BOARD_MODES[mode] || BOARD_MODES['6x6'];
}

export function getModeOptions() {
  return Object.entries(BOARD_MODES).map(([id, config]) => ({
    id,
    label: config.label,
    pairs: config.pairs,
    cols: config.cols,
    rows: config.rows,
  }));
}
