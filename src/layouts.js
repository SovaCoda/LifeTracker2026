// Seat layouts per player count, expressed as CSS Grid templates so the board
// reshapes purely from data. Each seat is placed into a named grid area (p1..pN)
// and rotated so a player sitting on that edge of the table reads it upright.
//
// Top-edge players are rotated 180deg; bottom-edge players stay at 0deg
// (mirrors the orientation the old tracker used, which felt natural in play).

export var LAYOUTS = {
  2: {
    columns: '1fr',
    rows: '1fr 1fr',
    areas: '"p1" "p2"',
    rotations: { p1: 180, p2: 0 }
  },
  3: {
    columns: '1fr 1fr',
    rows: '1fr 1fr',
    areas: '"p1 p1" "p2 p3"',
    rotations: { p1: 180, p2: 0, p3: 0 }
  },
  4: {
    columns: '1fr 1fr',
    rows: '1fr 1fr',
    areas: '"p1 p2" "p3 p4"',
    rotations: { p1: 180, p2: 180, p3: 0, p4: 0 }
  },
  5: {
    columns: 'repeat(6, 1fr)',
    rows: '1fr 1fr',
    areas: '"p1 p1 p2 p2 p3 p3" "p4 p4 p4 p5 p5 p5"',
    rotations: { p1: 180, p2: 180, p3: 180, p4: 0, p5: 0 }
  },
  6: {
    columns: '1fr 1fr 1fr',
    rows: '1fr 1fr',
    areas: '"p1 p2 p3" "p4 p5 p6"',
    rotations: { p1: 180, p2: 180, p3: 180, p4: 0, p5: 0, p6: 0 }
  }
};
