import { W } from './constants.js';

export const state = {
  status: 'start', // start | playing | level_clear | level_fail | gameover | win
  levelIdx: 0,
  score: 0,
  hearts: 3,
  mismatches: 0,
  levelStartTime: 0,
  levelTime: 0,

  rects: [],
  bullets: [],
  particles: [],
  spawnTimer: 0,
  lastTime: 0,

  // per-level stats
  stats: { correct: [0,0,0], mismatches: 0, survived: 0, score: 0 },

  charX: W / 2,
  aimAngle: -Math.PI / 2, // pointing up
  mouseX: W / 2,
  mouseY: 0,
  currentColorIdx: 0, // which color the character is loaded with

  // aiming guide
  guidePoints: []
};
