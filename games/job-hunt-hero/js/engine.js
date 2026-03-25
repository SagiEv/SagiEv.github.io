import { W, H, FLOOR_Y, CHAR_SIZE, BULLET_SPEED, BOUNCE_LIMIT, COLORS, LEVELS } from './constants.js';
import { state } from './state.js';
import { randInt, saveProgress } from './utils.js';
import { updateHUD, hideAllOverlays, showResultOverlay } from './ui.js';

export function cycleColor(dir = 1) {
  state.currentColorIdx = (state.currentColorIdx + dir + COLORS.length) % COLORS.length;
}

export function spawnRect() {
  const cfg = LEVELS[state.levelIdx];
  if (state.rects.length >= cfg.maxRects) return;
  const col = COLORS[randInt(0, COLORS.length - 1)];
  const rw = randInt(42, 68);
  const rh = randInt(22, 34);
  const x = randInt(4, W - rw - 4);
  state.rects.push({
    x, y: -rh, w: rw, h: rh,
    colorId: col.id,
    speed: cfg.rectSpeed * (0.85 + Math.random() * 0.3),
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.02,
    wobbleAmp: randInt(8, 24),
    baseX: x,
    age: 0,
  });
}

export function computeGuide(startX, startY, angle) {
  let pts = [{ x: startX, y: startY }];
  let vx = Math.cos(angle) * BULLET_SPEED;
  let vy = Math.sin(angle) * BULLET_SPEED;
  let x = startX, y = startY;
  let bounces = 0;
  for (let i = 0; i < 200; i++) {
    x += vx; y += vy;
    if (x < 6) { x = 6; vx = -vx; bounces++; }
    if (x > W - 6) { x = W - 6; vx = -vx; bounces++; }
    if (y < 0) { y = 0; vy = -vy; bounces++; }
    pts.push({ x, y });
    if (y > FLOOR_Y || bounces > BOUNCE_LIMIT) break;
  }
  return pts;
}

export function shoot() {
  const col = COLORS[state.currentColorIdx];
  const startX = state.charX;
  const startY = FLOOR_Y - CHAR_SIZE / 2;
  state.bullets.push({
    x: startX, y: startY,
    vx: Math.cos(state.aimAngle) * BULLET_SPEED,
    vy: Math.sin(state.aimAngle) * BULLET_SPEED,
    colorId: col.id,
    bounces: 0,
    trail: [],
  });
}

export function spawnParticles(x, y, color, count, big) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * (big ? 4 : 2);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      color,
      life: 1,
      decay: 0.04 + Math.random() * 0.04,
      r: big ? (3 + Math.random() * 4) : (1 + Math.random() * 2),
    });
  }
}

export function checkCollisions() {
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi];
    for (let ri = state.rects.length - 1; ri >= 0; ri--) {
      const r = state.rects[ri];
      if (b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h) {
        const match = b.colorId === r.colorId;
        const pts = match ? 30 : -15;
        state.score = Math.max(0, state.score + pts);
        if (match) {
          state.stats.correct[r.colorId]++;
          spawnParticles(r.x + r.w / 2, r.y + r.h / 2, COLORS[r.colorId].hex, 14, true);
        } else {
          state.mismatches++;
          state.stats.mismatches++;
          state.hearts--;
          spawnParticles(r.x + r.w / 2, r.y + r.h / 2, '#ffffff', 6, false);
          if (state.hearts <= 0) {
            endLevel(false);
            return;
          }
        }
        state.rects.splice(ri, 1);
        state.bullets.splice(bi, 1);
        updateHUD();
        break;
      }
    }
  }
}

export function update(dt) {
  if (state.status !== 'playing') return;
  const cfg = LEVELS[state.levelIdx];
  state.levelTime = (Date.now() - state.levelStartTime) / 1000;

  state.spawnTimer += dt;
  if (state.spawnTimer >= cfg.spawnInterval) {
    state.spawnTimer = 0;
    spawnRect();
    const bonus = Math.floor(state.levelTime / 20);
    for (let i = 0; i < bonus && state.rects.length < cfg.maxRects + 2; i++) spawnRect();
  }

  for (let i = state.rects.length - 1; i >= 0; i--) {
    const r = state.rects[i];
    r.age += dt;
    r.wobble += r.wobbleSpeed * (dt / 16);
    r.x = r.baseX + Math.sin(r.wobble) * r.wobbleAmp;
    r.x = Math.max(0, Math.min(W - r.w, r.x));
    r.y += r.speed * (dt / 16);

    if (r.y + r.h >= FLOOR_Y - CHAR_SIZE / 2) {
      spawnParticles(r.x + r.w / 2, r.y + r.h / 2, COLORS[r.colorId].hex, 8, false);
      state.rects.splice(i, 1);
      state.hearts--;
      updateHUD();
      if (state.hearts <= 0) { endLevel(false); return; }
    }
  }

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 5) b.trail.shift();
    b.x += b.vx; b.y += b.vy;
    if (b.x < 6) { b.x = 6; b.vx = -b.vx; b.bounces++; }
    if (b.x > W - 6) { b.x = W - 6; b.vx = -b.vx; b.bounces++; }
    if (b.y < 0) { b.y = 0; b.vy = -b.vy; b.bounces++; }
    if (b.y > H || b.bounces > BOUNCE_LIMIT) { state.bullets.splice(i, 1); }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  checkCollisions();

  if (state.score >= cfg.targetScore) {
    endLevel(true);
    return;
  }

  const startX = state.charX;
  const startY = FLOOR_Y - CHAR_SIZE / 2;
  state.guidePoints = computeGuide(startX, startY, state.aimAngle);

  updateHUD();
}

export function startLevel(idx) {
  state.levelIdx = idx;
  const cfg = LEVELS[idx];
  state.hearts = cfg.heartsAllowed;
  state.mismatches = 0;
  state.rects = [];
  state.bullets = [];
  state.particles = [];
  state.spawnTimer = cfg.spawnInterval * 0.6; 
  state.levelStartTime = Date.now();
  state.levelTime = 0;
  state.stats = { correct: [0, 0, 0], mismatches: 0, survived: 0, score: 0 };
  
  const initCount = Math.min(3, cfg.maxRects);
  for (let i = 0; i < initCount; i++) spawnRect();
  
  state.status = 'playing';
  hideAllOverlays();
  updateHUD();
}

export function endLevel(success) {
  state.status = success ? 'level_clear' : 'level_fail';
  state.stats.survived = Math.floor(state.levelTime);
  state.stats.score = state.score;
  saveProgress(state.levelIdx, success, state.score);
  showResultOverlay(success);
}
