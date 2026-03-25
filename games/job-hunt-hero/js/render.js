import { W, H, FLOOR_Y, CHAR_SIZE, COLORS, LEVELS } from './constants.js';
import { state } from './state.js';
import { imgCache } from './graphics.js';
import { roundRect } from './utils.js';

export function drawBG(ctx) {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.fillStyle = '#ff3e5e08';
  ctx.fillRect(0, FLOOR_Y + CHAR_SIZE / 2 + 4, W, H - FLOOR_Y - CHAR_SIZE / 2 - 4);
  ctx.strokeStyle = '#ff3e5e22';
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); 
  ctx.moveTo(0, FLOOR_Y + CHAR_SIZE / 2 + 4); 
  ctx.lineTo(W, FLOOR_Y + CHAR_SIZE / 2 + 4); 
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawGuide(ctx) {
  if (state.guidePoints.length < 2) return;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = COLORS[state.currentColorIdx].hex;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(state.guidePoints[0].x, state.guidePoints[0].y);
  for (let i = 1; i < state.guidePoints.length; i++) {
    ctx.lineTo(state.guidePoints[i].x, state.guidePoints[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  const ep = state.guidePoints[state.guidePoints.length - 1];
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = COLORS[state.currentColorIdx].hex;
  ctx.beginPath(); 
  ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2); 
  ctx.fill();
  ctx.restore();
}

export function drawRects(ctx) {
  for (const r of state.rects) {
    const img = imgCache[`rect_${r.colorId}`];
    if (!img) continue;
    ctx.save();
    ctx.shadowColor = COLORS[r.colorId].hex;
    ctx.shadowBlur = 10;
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
    ctx.restore();
  }
}

export function drawBullets(ctx) {
  for (const b of state.bullets) {
    const img = imgCache[`bullet_${b.colorId}`];
    if (!img) continue;
    const sz = 20;
    ctx.save();
    ctx.shadowColor = COLORS[b.colorId].hex;
    ctx.shadowBlur = 12;
    ctx.drawImage(img, b.x - sz / 2, b.y - sz / 2, sz, sz);
    ctx.restore();
  }
}

export function drawChar(ctx) {
  const img = imgCache['char'];
  if (!img) return;
  const cy = FLOOR_Y;
  ctx.save();
  ctx.shadowColor = COLORS[state.currentColorIdx].hex;
  ctx.shadowBlur = 20;
  ctx.drawImage(img, state.charX - CHAR_SIZE / 2, cy - CHAR_SIZE / 2, CHAR_SIZE, CHAR_SIZE);
  ctx.restore();

  const sw = 18, gap = 4, total = COLORS.length * (sw + gap) - gap;
  let sx = state.charX - total / 2;
  COLORS.forEach((col, i) => {
    ctx.save();
    ctx.fillStyle = col.hex;
    if (i === state.currentColorIdx) {
      ctx.shadowColor = col.hex; 
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#fff'; 
      ctx.lineWidth = 1.5;
    } else {
      ctx.globalAlpha = 0.4;
    }
    ctx.beginPath(); 
    roundRect(ctx, sx, cy + CHAR_SIZE / 2 + 4, sw, 7, 2); 
    ctx.fill();
    if (i === state.currentColorIdx) ctx.stroke();
    ctx.restore();
    sx += sw + gap;
  });
}

export function drawParticles(ctx) {
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; 
    ctx.shadowBlur = 6;
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();
  }
}

export function drawFloorBar(ctx) {
  const gy = FLOOR_Y - CHAR_SIZE / 2 - 8;
  ctx.strokeStyle = '#ffffff18';
  ctx.lineWidth = 1;
  ctx.beginPath(); 
  ctx.moveTo(0, gy); 
  ctx.lineTo(W, gy); 
  ctx.stroke();

  const cfg = LEVELS[state.levelIdx];
  const prog = Math.min(1, state.score / cfg.targetScore);
  ctx.fillStyle = '#ffffff0a';
  ctx.fillRect(0, gy - 4, W, 4);
  ctx.fillStyle = COLORS[state.currentColorIdx].hex + '88';
  ctx.fillRect(0, gy - 4, W * prog, 4);
}

export function draw(ctx) {
  drawBG(ctx);
  if (state.status === 'playing' || state.status === 'level_clear' || state.status === 'level_fail') {
    drawGuide(ctx);
    drawRects(ctx);
    drawBullets(ctx);
    drawParticles(ctx);
    drawChar(ctx);
    drawFloorBar(ctx);
    
    const cfg = LEVELS[state.levelIdx];
    ctx.fillStyle = '#ffffff22';
    ctx.font = '10px "Share Tech Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: ${cfg.targetScore}`, 8, FLOOR_Y - CHAR_SIZE / 2 - 12);
    ctx.textAlign = 'right';
    ctx.fillText(`${state.score}/${cfg.targetScore}`, W - 8, FLOOR_Y - CHAR_SIZE / 2 - 12);
  }
}
