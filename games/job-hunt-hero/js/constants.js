export const W = 520, H = 580;
export const FLOOR_Y = H - 48; // character sits here
export const CHAR_SIZE = 64;
export const BULLET_SPEED = 9;
export const BOUNCE_LIMIT = 3; // max wall bounces per bullet

// UI Copy Constants - Easy to customize here
export const GAME_TITLE    = '◈ JOB HUNT HERO ◈';
export const GAME_SUBTITLE = 'CV QUEST';
export const GAME_DESC     = 'Match CV to job application · Walls bounce!';
export const TUTORIAL_TITLE = '◈ HOW TO PLAY ◈';

export const UI_TEXT = {
  // ── Start screen ──────────────────────────────────────────────────────────
  START_HINT:           'Q/E or Scroll to switch color · Click/Space to shoot',
  MISMATCH_WARNING:     '❤️ Mismatches cost hearts & deduct points',
  SELECT_LEVEL:         '— SELECT LEVEL —',

  // ── Buttons ───────────────────────────────────────────────────────────────
  BTN_START:            '▶ START GAME',
  BTN_CONTINUE:         '▶ CONTINUE',
  BTN_TUTORIAL:         '? TUTORIAL',
  BTN_NEW_GAME:         '↺ NEW GAME',
  BTN_BACK:             '← BACK TO MENU',
  BTN_MAP:              '⊞ MAP',
  BTN_NEXT:             '▶ NEXT LEVEL',
  BTN_VICTORY:          '▶ VICTORY!',
  BTN_RETRY:            '↺ RETRY',
  BTN_MAIN_MENU:        '⌂ MAIN MENU',

  // ── Reset confirmation ────────────────────────────────────────────────────
  RESET_TITLE:          'RESET PROGRESS?',
  RESET_BODY:           'All cleared levels and best scores will be erased.<br>This cannot be undone.',
  RESET_CONFIRM:        '✓ RESET',
  RESET_CANCEL:         '✕ CANCEL',

  // ── Tutorial: Objective ───────────────────────────────────────────────────
  TUT_OBJ_HEADING:      '🎯 OBJECTIVE',
  TUT_OBJ_TEXT:         'Help Sagi get his dream job! Match each CV to the same-colored job application before it reaches the bottom. Reach the target score to complete the level.',

  // ── Tutorial: Controls ────────────────────────────────────────────────────
  TUT_CTRL_HEADING:     '🕹 CONTROLS',
  TUT_CTRL_AIM_KEY:     'Mouse Move',
  TUT_CTRL_AIM_DESC:    'Aim the shot — a dotted guide line shows the trajectory, including wall bounces',
  TUT_CTRL_SHOOT_KEY:   'Click / Space',
  TUT_CTRL_SHOOT_DESC:  'Shoot a bullet in the aimed direction',
  TUT_CTRL_LEFT_KEY:    'Q / ←',
  TUT_CTRL_LEFT_DESC:   'Cycle bullet color <b>left</b> (previous color)',
  TUT_CTRL_RIGHT_KEY:   'E / →',
  TUT_CTRL_RIGHT_DESC:  'Cycle bullet color <b>right</b> (next color)',
  TUT_CTRL_SCROLL_KEY:  'Scroll ↑↓',
  TUT_CTRL_SCROLL_DESC: 'Cycle bullet color with the mouse wheel',

  // ── Tutorial: Colors ──────────────────────────────────────────────────────
  TUT_COL_HEADING:      '🎨 COLORS',
  TUT_COL_DESC:         'Your currently loaded color is shown in the <b>selector bar</b> under your character, and highlighted with a glow. Switch colors before shooting to match incoming rectangles.',

  // ── Tutorial: Scoring ─────────────────────────────────────────────────────
  TUT_SCO_HEADING:      '⭐ SCORING',
  TUT_SCO_HIT:          '+30 pts',
  TUT_SCO_HIT_DESC:     'Correct color match — rectangle destroyed cleanly',
  TUT_SCO_MISS:         '−15 pts',
  TUT_SCO_MISS_DESC:    'Wrong color — rectangle destroyed but you lose a heart and points',
  TUT_SCO_FLOOR:        '−1 ❤️',
  TUT_SCO_FLOOR_DESC:   'A rectangle reaches the bottom — lose a heart instantly',
  TUT_SCO_BAR:          'The <b>progress bar</b> at the top of the floor shows how close you are to the level\'s target score.',

  // ── Tutorial: Hearts ──────────────────────────────────────────────────────
  TUT_HRT_HEADING:      '❤️ HEARTS',
  TUT_HRT_DESC:         'Each level gives you a limited number of hearts. Lose them all — from mismatches or letting rectangles hit the floor — and the level ends in <span style="color:#ff3e5e">FAILURE</span>. Later levels are stingier: some give only <b>1 heart</b>.',

  // ── Tutorial: Wall Bouncing ───────────────────────────────────────────────
  TUT_WAL_HEADING:      '🔁 WALL BOUNCING',
  TUT_WAL_DESC:         'Bullets bounce off the <b>left, right, and top walls</b>. Use this to reach rectangles hiding near the edges or behind others. The aim guide previews the full bounce path before you shoot.',

  // ── Tutorial: Levels ──────────────────────────────────────────────────────
  TUT_LVL_HEADING:      '📈 LEVELS',

  // ── Result screens ────────────────────────────────────────────────────────
  RESULT_CLEAR:         'LEVEL CLEAR',
  RESULT_FAIL:          'LEVEL FAILED',
  RESULT_MISMATCHES:    'Mismatches',
  RESULT_SCORE:         'Score',
  RESULT_SURVIVED:      'Survived',
  WIN_TITLE:            'VICTORY',
  WIN_SUBTITLE:         'ALL LEVELS CONQUERED',
  WIN_LABEL:            'FINAL SCORE',
  ARCADE_TITLE:         '// ARCADE GAMES',
};

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
