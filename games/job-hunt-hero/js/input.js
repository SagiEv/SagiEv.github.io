import { W, H, FLOOR_Y, CHAR_SIZE } from './constants.js';
import { state } from './state.js';
import { shoot, cycleColor } from './engine.js';

export function setupInput(canvas) {
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = (e.clientX - rect.left) * (W / rect.width);
    state.mouseY = (e.clientY - rect.top) * (H / rect.height);
    
    // Aim from character
    const cy = FLOOR_Y - CHAR_SIZE / 2;
    const dx = state.mouseX - state.charX;
    const dy = state.mouseY - cy;
    state.aimAngle = Math.atan2(dy, dx);
    
    // Clamp to upper hemisphere (don't shoot down)
    if (state.aimAngle > -0.1 && state.aimAngle < Math.PI + 0.1) {
      if (state.aimAngle > 0) state.aimAngle = state.aimAngle > Math.PI / 2 ? Math.PI - 0.05 : -0.05;
    }
    // allow aiming left/right walls but not downward
    if (state.aimAngle > 0 && state.aimAngle < Math.PI) {
      // below horizontal — clamp to near-horizontal
      state.aimAngle = (dx < 0) ? -(Math.PI - 0.08) : -0.08;
    }
  });

  canvas.addEventListener('click', () => {
    if (state.status === 'playing') shoot();
  });

  canvas.addEventListener('wheel', e => {
    if (state.status === 'playing') cycleColor(e.deltaY > 0 ? 1 : -1);
  });

  document.addEventListener('keydown', e => {
    if (state.status !== 'playing') return;
    if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') cycleColor(-1);
    if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') cycleColor(1);
    if (e.key === ' ') { e.preventDefault(); shoot(); }
  });
}
