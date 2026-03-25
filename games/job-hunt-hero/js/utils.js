import { LEVELS } from './constants.js';

export function roundRect(c, x, y, w, h, r) {
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
}

export function lighten(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

export function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ─── PROGRESS PERSISTENCE ────────────────────────────────────────────────────
export function loadProgress() {
  try {
    const raw = localStorage.getItem('chromatic_blitz_progress');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return LEVELS.map(() => ({ cleared: false, bestScore: 0 }));
}

export function saveProgress(idx, cleared, sc) {
  const p = loadProgress();
  if (cleared) p[idx].cleared = true;
  if (sc > p[idx].bestScore) p[idx].bestScore = sc;
  try {
    localStorage.setItem('chromatic_blitz_progress', JSON.stringify(p));
  } catch(e) {}
}

export function highestUnlocked() {
  const p = loadProgress();
  // Level 0 is always unlocked; each cleared level unlocks the next
  for (let i = 0; i < LEVELS.length; i++) {
    if (!p[i].cleared) return i; // this is the furthest available
  }
  return LEVELS.length - 1; // all cleared — all accessible
}
