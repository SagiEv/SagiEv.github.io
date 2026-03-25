import { COLORS } from './constants.js';
import { roundRect, lighten } from './utils.js';

export const imgCache = {};

/* export function makeRectPNG(colorHex, w = 48, h = 28) {
  const oc = new OffscreenCanvas(w, h);
  const c = oc.getContext('2d');
  
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, lighten(colorHex, 40));
  g.addColorStop(1, colorHex);
  c.fillStyle = g;
  c.beginPath(); 
  roundRect(c, 2, 2, w - 4, h - 4, 5); 
  c.fill();
  
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.beginPath(); 
  roundRect(c, 4, 3, w - 8, 6, 3); 
  c.fill();
  
  c.strokeStyle = lighten(colorHex, 60);
  c.lineWidth = 1.5;
  c.beginPath(); 
  roundRect(c, 1, 1, w - 2, h - 2, 5); 
  c.stroke();
  
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.font = `bold ${Math.floor(h * 0.55)}px monospace`;
  c.textAlign = 'center'; 
  c.textBaseline = 'middle';
  c.fillText('■', w / 2, h / 2 + 1);
  return oc.transferToImageBitmap();
}

export function makeBulletPNG(colorHex, r = 10) {
  const sz = r * 2 + 4;
  const oc = new OffscreenCanvas(sz, sz);
  const c = oc.getContext('2d');
  
  const g = c.createRadialGradient(sz / 2, sz / 2, 1, sz / 2, sz / 2, sz / 2);
  g.addColorStop(0, colorHex);
  g.addColorStop(0.5, colorHex + 'bb');
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.beginPath(); 
  c.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2); 
  c.fill();
  
  c.fillStyle = '#fff';
  c.beginPath(); 
  c.arc(sz / 2, sz / 2, r * 0.4, 0, Math.PI * 2); 
  c.fill();
  return oc.transferToImageBitmap();
}

export function makeCharPNG(colors, size = 36) {
  const oc = new OffscreenCanvas(size, size);
  const c = oc.getContext('2d');
  
  c.fillStyle = '#1a1a2e';
  c.beginPath();
  c.arc(size / 2, size / 2 + 2, size / 2 - 2, 0, Math.PI * 2);
  c.fill();
  
  const segW = (size - 8) / 3;
  colors.forEach((col, i) => {
    c.fillStyle = col.hex;
    c.fillRect(4 + i * segW, 4, segW, 6);
  });
  
  c.fillStyle = '#eee';
  c.fillRect(size / 2 - 7, size / 2 - 3, 5, 5);
  c.fillRect(size / 2 + 2, size / 2 - 3, 5, 5);
  
  c.fillStyle = '#555';
  c.fillRect(size / 2 - 2, size / 2 + 6, 4, 4);
  c.fillStyle = '#aaa';
  c.fillRect(size / 2 - 1, 0, 2, 6);
  return oc.transferToImageBitmap();
} */

async function loadImg(src) {
  const img = new Image();
  img.src = src;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

export async function buildCache() {
  // Load raw PNG images exactly as they are in the directory
  const rawRect = await loadImg('assets/rect.png');
  const rawBullet = await loadImg('assets/bullet.png');
  imgCache['char'] = await loadImg('assets/character.png');

  // We loop through the master COLORS block from constants.js to generate identically colored versions of your standard assets
  for (const col of COLORS) {
    // Dynamically tint the rect sprite to match the current color hex using HTML5 multiply blend modes
    const rOc = new OffscreenCanvas(rawRect.width, rawRect.height);
    const rCtx = rOc.getContext('2d');
    rCtx.drawImage(rawRect, 0, 0);
    rCtx.globalCompositeOperation = 'multiply';
    rCtx.fillStyle = col.hex;
    rCtx.fillRect(0, 0, rawRect.width, rawRect.height);
    rCtx.globalCompositeOperation = 'destination-in';
    rCtx.drawImage(rawRect, 0, 0);
    imgCache[`rect_${col.id}`] = rOc.transferToImageBitmap();

    // Dynamically tint the bullet sprite
    const bOc = new OffscreenCanvas(rawBullet.width, rawBullet.height);
    const bCtx = bOc.getContext('2d');
    bCtx.drawImage(rawBullet, 0, 0);
    bCtx.globalCompositeOperation = 'multiply';
    bCtx.fillStyle = col.hex;
    bCtx.fillRect(0, 0, rawBullet.width, rawBullet.height);
    bCtx.globalCompositeOperation = 'destination-in';
    bCtx.drawImage(rawBullet, 0, 0);
    imgCache[`bullet_${col.id}`] = bOc.transferToImageBitmap();
  }
}
