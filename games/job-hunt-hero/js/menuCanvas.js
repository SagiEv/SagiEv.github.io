// menuCanvas.js — Animated background for the main menu overlay
// Draws: network dots + connecting lines + floating colored rects

import { COLORS } from './constants.js';

let _rafId = null;
let _canvas = null;
let _ctx = null;

const NUM_DOTS   = 38;
const NUM_RECTS  = 9;
const LINK_DIST  = 110; // max pixel distance to draw a line between dots

// ─── Network dots (particle network) ─────────────────────────────────────────
const dots = [];
function initDots(w, h) {
  dots.length = 0;
  for (let i = 0; i < NUM_DOTS; i++) {
    dots.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    });
  }
}

function stepDots(w, h) {
  for (const d of dots) {
    d.x += d.vx; d.y += d.vy;
    if (d.x < 0 || d.x > w) d.vx *= -1;
    if (d.y < 0 || d.y > h) d.vy *= -1;
  }
}

function drawNetwork(ctx, w, h) {
  // Connections
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < LINK_DIST) {
        const alpha = (1 - dist / LINK_DIST) * 0.22;
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
  // Dots
  for (const d of dots) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,229,255,0.45)';
    ctx.fill();
  }
}

// ─── Floating game rects ─────────────────────────────────────────────────────
const floatRects = [];
function initRects(w, h) {
  floatRects.length = 0;
  for (let i = 0; i < NUM_RECTS; i++) {
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    floatRects.push({
      x: Math.random() * (w - 60),
      y: Math.random() * h,
      w: 38 + Math.random() * 28,
      h: 18 + Math.random() * 14,
      speed: 0.25 + Math.random() * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleAmp: 8 + Math.random() * 14,
      wobbleSpeed: 0.012 + Math.random() * 0.012,
      baseX: 0,
      color: col.hex,
      glow: col.glow,
      alpha: 0.18 + Math.random() * 0.14,
    });
    floatRects[floatRects.length - 1].baseX = floatRects[floatRects.length - 1].x;
  }
}

function stepRects(w, h) {
  for (const r of floatRects) {
    r.wobble += r.wobbleSpeed;
    r.x = r.baseX + Math.sin(r.wobble) * r.wobbleAmp;
    r.y += r.speed;
    if (r.y > h + 30) {
      r.y = -r.h - 10;
      r.baseX = Math.random() * (w - r.w);
    }
  }
}

function drawRects(ctx) {
  for (const r of floatRects) {
    ctx.save();
    ctx.globalAlpha = r.alpha;
    ctx.shadowColor = r.glow;
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = r.color;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 5);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function tick() {
  if (!_canvas) return;
  const w = _canvas.width;
  const h = _canvas.height;

  _ctx.clearRect(0, 0, w, h);
  stepDots(w, h);
  stepRects(w, h);
  drawNetwork(_ctx, w, h);
  drawRects(_ctx);

  _rafId = requestAnimationFrame(tick);
}

export function startMenuAnimation(canvas) {
  _canvas = canvas;
  _ctx    = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  initDots(w, h);
  initRects(w, h);
  if (_rafId) cancelAnimationFrame(_rafId);
  tick();
}

export function stopMenuAnimation() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  _canvas = null;
  _ctx    = null;
}
