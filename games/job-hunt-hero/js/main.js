import { state } from './state.js';
import { buildCache } from './graphics.js';
import { update } from './engine.js';
import { draw } from './render.js';
import { showStartOverlay, updateHUD } from './ui.js';
import { setupInput } from './input.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function loop(ts) {
  const dt = Math.min(ts - state.lastTime, 50);
  state.lastTime = ts;
  update(dt);
  draw(ctx);
  requestAnimationFrame(loop);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
(async () => {
  await buildCache();
  
  // Set up inputs
  setupInput(canvas);
  
  // Initial draw and state
  draw(ctx);
  showStartOverlay();
  updateHUD();
  
  // Start loop
  requestAnimationFrame(ts => {
    state.lastTime = ts;
    loop(ts);
  });
})();
