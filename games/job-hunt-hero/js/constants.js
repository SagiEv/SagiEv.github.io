export const W = 520, H = 580;
export const FLOOR_Y = H - 48; // character sits here
export const CHAR_SIZE = 64;
export const BULLET_SPEED = 9;
export const BOUNCE_LIMIT = 3; // max wall bounces per bullet

// UI Copy Constants - Easy to customize here
export const GAME_TITLE = '◈ JOB HUNT HERO ◈';
export const GAME_SUBTITLE = 'CV QUEST';
export const GAME_DESC = 'Match CV to job application · Walls bounce!';
export const TUTORIAL_TITLE = '◈ HOW TO PLAY ◈';

export const COLORS = [
  { id: 0, name: 'RED',   hex: '#ff3e5e', glow: '#ff3e5e88' },
  { id: 1, name: 'CYAN',  hex: '#00e5ff', glow: '#00e5ff88' },
  { id: 2, name: 'GOLD',  hex: '#ffd700', glow: '#ffd70088' },
];

export const LEVELS = [
  { level:1, maxRects:5,  spawnInterval:3000, rectSpeed:0.35, heartsAllowed:3, targetScore:300,  title:'BOOT UP'    },
  { level:2, maxRects:7,  spawnInterval:2500, rectSpeed:0.50, heartsAllowed:3, targetScore:600,  title:'WARM UP'    },
  { level:3, maxRects:8,  spawnInterval:2000, rectSpeed:0.65, heartsAllowed:2, targetScore:1000, title:'ACCELERATE' },
  { level:4, maxRects:10, spawnInterval:1700, rectSpeed:0.80, heartsAllowed:2, targetScore:1500, title:'OVERDRIVE'  },
  { level:5, maxRects:12, spawnInterval:1400, rectSpeed:1.00, heartsAllowed:1, targetScore:2200, title:'CHAOS'      },
  { level:6, maxRects:14, spawnInterval:1100, rectSpeed:1.20, heartsAllowed:1, targetScore:9999, title:'OBLIVION'   },
];
