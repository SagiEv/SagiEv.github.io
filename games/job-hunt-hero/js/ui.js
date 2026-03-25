import { COLORS, LEVELS, BOUNCE_LIMIT, GAME_TITLE, GAME_SUBTITLE, GAME_DESC, TUTORIAL_TITLE } from './constants.js';
import { state } from './state.js';
import { loadProgress, highestUnlocked } from './utils.js';
import { startLevel } from './engine.js';

export let activeOverlay = null;

export function updateHUD() {
  document.getElementById('hud-level').textContent = state.levelIdx + 1;
  document.getElementById('hud-score').textContent = state.score;
  document.getElementById('hud-mismatches').textContent = state.mismatches;
  document.getElementById('hud-time').textContent = Math.floor(state.levelTime) + 's';
  const cfg = LEVELS[state.levelIdx];
  let h = '';
  for (let i = 0; i < cfg.heartsAllowed; i++) {
    h += i < state.hearts ? '❤️' : '🖤';
  }
  document.getElementById('hearts-display').innerHTML = h;
}

export function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  activeOverlay = null;
}

export function makeOverlay() {
  const canvas = document.getElementById('game-canvas');
  const el = document.createElement('div');
  el.className = 'overlay';
  canvas.parentElement.style.position = 'relative';
  canvas.parentElement.appendChild(el);
  activeOverlay = el;
  return el;
}

export function buildLevelMapHTML(progress, maxUnlocked) {
  const NODES_PER_ROW = 3;
  const rows = [];
  for (let i = 0; i < LEVELS.length; i += NODES_PER_ROW) {
    rows.push(LEVELS.slice(i, i + NODES_PER_ROW).map((l, j) => ({ ...l, idx: i + j })));
  }

  function nodeHTML(lv) {
    const p = progress[lv.idx];
    const isCleared = p.cleared;
    const isUnlocked = lv.idx <= maxUnlocked;
    const isCurrent = lv.idx === maxUnlocked && !isCleared;
    let cls = 'map-node';
    if (isCleared) cls += ' cleared unlocked';
    else if (isCurrent) cls += ' current-best unlocked';
    else if (isUnlocked) cls += ' unlocked';
    else cls += ' locked';
    const inner = isUnlocked ? `${lv.idx + 1}` : `<span class="map-lock-icon">🔒</span>`;
    const star = isCleared ? `<span class="map-node-star">⭐</span>` : '';
    const badge = isCleared && p.bestScore > 0 ? `<div class="map-score-badge">${p.bestScore}</div>` : '';
    return `<div class="${cls}" data-idx="${lv.idx}" title="${isUnlocked ? lv.title : 'LOCKED'}">
      <div class="map-node-circle">${inner}${star}${badge}</div>
      <div class="map-node-label">${isUnlocked ? lv.title : '???'}</div>
    </div>`;
  }

  function connHTML(fromIdx) {
    const active = fromIdx < maxUnlocked || progress[fromIdx].cleared;
    return `<div class="map-connector${active ? ' active' : ''}"></div>`;
  }

  let html = `<div id="level-map">`;
  rows.forEach((row, ri) => {
    const isReverse = ri % 2 === 1;
    html += `<div class="map-row${isReverse ? ' reverse' : ''}">`;
    row.forEach((lv, j) => {
      html += nodeHTML(lv);
      if (j < row.length - 1) html += connHTML(lv.idx);
    });
    html += `</div>`;
    if (ri < rows.length - 1) {
      const lastOfRow = row[row.length - 1];
      const active = lastOfRow.idx < maxUnlocked || progress[lastOfRow.idx].cleared;
      const side = isReverse ? 'flex-start' : 'flex-end';
      html += `<div style="display:flex;width:100%;justify-content:${side};padding:0 10px">
        <div class="map-vert-connector${active ? ' active' : ''}"></div>
      </div>`;
    }
  });
  html += `<div class="map-legend">
    <span><span class="legend-dot" style="color:#2ecc71;border-color:#2ecc71"></span>Cleared</span>
    <span><span class="legend-dot" style="color:#ffd700;border-color:#ffd700"></span>Available</span>
    <span><span class="legend-dot" style="color:#333;border-color:#333"></span>Locked</span>
  </div></div>`;
  return html;
}

export function showStartOverlay() {
  const el = makeOverlay();
  const progress = loadProgress();
  const maxUnlocked = highestUnlocked();
  const anyProgress = progress.some(p => p.cleared || p.bestScore > 0);

  const mapSection = anyProgress
    ? `<div class="map-title">— SELECT LEVEL —</div>${buildLevelMapHTML(progress, maxUnlocked)}`
    : `<h2 style="margin-bottom:2px">${GAME_SUBTITLE}</h2>
       <div style="font-size:1rem;color:#555;text-align:center;line-height:1.9;max-width:300px">
         ${GAME_DESC}<br>
         <span style="color:#ff3e5e">❤️ Mismatches cost hearts &amp; deduct points</span><br>
         <b>Q/E</b> or <b>Scroll</b> to switch color · <b>Click</b>/<b>Space</b> to shoot
       </div>
       <div style="display:flex;gap:12px;margin:2px 0;font-size:0.75rem">
         ${COLORS.map(c => `<span><span class="color-dot" style="background:${c.hex}"></span>${c.name}</span>`).join('')}
       </div>`;

  el.innerHTML = `
    <h1 style="color:#fff;font-size:1.5rem;margin-bottom:0">${GAME_TITLE}</h1>
    ${mapSection}
    <div style="display:flex;gap:10px;margin-top:${anyProgress ? '4px' : '0'}">
      ${anyProgress ? `<button class="btn" id="btn-new-game" style="font-size:0.7rem;padding:8px 16px">↺ NEW GAME</button>` : ''}
      <button class="btn" id="btn-tutorial" style="font-size:0.7rem;padding:8px 16px">? TUTORIAL</button>
      <button class="btn" id="btn-start">${anyProgress ? '▶ CONTINUE' : '▶ START GAME'}</button>
    </div>
  `;

  el.addEventListener('click', e => {
    const t = e.target.closest('button, .map-node');
    if (!t) return;

    if (t.id === 'btn-start') {
      state.score = 0;
      startLevel(maxUnlocked);

    } else if (t.id === 'btn-tutorial') {
      hideAllOverlays(); showTutorialOverlay();

    } else if (t.id === 'btn-new-game') {
      el.innerHTML = `
        <h1 style="color:#ff3e5e;font-size:1.4rem">RESET PROGRESS?</h1>
        <div style="font-size:0.75rem;color:#888;text-align:center;line-height:1.8">
          All cleared levels and best scores will be erased.<br>
          This cannot be undone.
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn" id="btn-confirm-no"  style="border-color:#333;color:#666">✕ CANCEL</button>
          <button class="btn" id="btn-confirm-yes" style="border-color:#ff3e5e55;color:#ff3e5e">✓ RESET</button>
        </div>
      `;
      el.addEventListener('click', e2 => {
        const t2 = e2.target.closest('button');
        if (t2 && t2.id === 'btn-confirm-yes') {
          localStorage.removeItem('chromatic_blitz_progress');
          state.score = 0; hideAllOverlays(); showStartOverlay();
        } else if (t2 && t2.id === 'btn-confirm-no') {
          hideAllOverlays(); showStartOverlay();
        }
      }, { once: false });

    } else if (t.classList.contains('map-node') && t.classList.contains('unlocked')) {
      state.score = 0;
      startLevel(parseInt(t.dataset.idx));
    }
  });
}

export function showTutorialOverlay() {
  const el = makeOverlay();
  el.style.justifyContent = 'flex-start';
  el.style.paddingTop = '24px';
  el.style.paddingBottom = '24px';
  el.style.gap = '0';

  el.innerHTML = `
    <h1 style="flex-shrink:0;color:#fff;font-size:1.4rem;letter-spacing:0.25em;margin-bottom:14px">
      ${TUTORIAL_TITLE}
    </h1>

    <div style="flex:1;overflow-y:auto;width:100%;max-width:420px;padding:0 12px;margin-bottom:16px;display:flex;flex-direction:column;align-items:center;">
      <div class="tut-section">
        <div class="tut-heading open" data-target="tut-obj">🎯 OBJECTIVE <span class="tut-toggle">[-]</span></div>
      <div class="tut-body" id="tut-obj">
        Shoot falling colored rectangles before they reach the bottom of the screen.
        Match your bullet color to the rectangle color to score points.
        Reach the target score to clear each level.
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading open" data-target="tut-ctrl">🕹 CONTROLS <span class="tut-toggle">[-]</span></div>
      <div class="tut-controls" id="tut-ctrl">
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>Mouse Move</kbd></div>
          <div class="tut-desc">Aim the shot — a dotted guide line shows the trajectory, including wall bounces</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>Click</kbd> <span style="color:#444">or</span> <kbd>Space</kbd></div>
          <div class="tut-desc">Shoot a bullet in the aimed direction</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>Q</kbd> <span style="color:#444">or</span> <kbd>←</kbd></div>
          <div class="tut-desc">Cycle bullet color <b>left</b> (previous color)</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>E</kbd> <span style="color:#444">or</span> <kbd>→</kbd></div>
          <div class="tut-desc">Cycle bullet color <b>right</b> (next color)</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>Scroll ↑↓</kbd></div>
          <div class="tut-desc">Cycle bullet color with the mouse wheel</div>
        </div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-col">🎨 COLORS <span class="tut-toggle">[+]</span></div>
      <div id="tut-col" style="display: none;">
        <div class="tut-body" style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center">
          ${COLORS.map(c => `
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:28px;height:16px;border-radius:4px;background:${c.hex};box-shadow:0 0 8px ${c.hex}88"></div>
              <span style="color:${c.hex};font-size:0.8rem;letter-spacing:0.1em">${c.name}</span>
            </div>`).join('')}
        </div>
        <div class="tut-body" style="margin-top:8px">
          Your currently loaded color is shown in the <b>selector bar</b> under your character,
          and highlighted with a glow. Switch colors before shooting to match incoming rectangles.
        </div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-sco">⭐ SCORING <span class="tut-toggle">[+]</span></div>
      <div id="tut-sco" style="display: none;">
        <div class="tut-controls">
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#2ecc71">+30 pts</div>
            <div class="tut-desc">Correct color match — rectangle destroyed cleanly</div>
          </div>
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#ff3e5e">−15 pts</div>
            <div class="tut-desc">Wrong color — rectangle destroyed but you lose a heart and points</div>
          </div>
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#ff3e5e">−1 ❤️</div>
            <div class="tut-desc">A rectangle reaches the bottom — lose a heart instantly</div>
          </div>
        </div>
        <div class="tut-body" style="margin-top:6px">
          The <b>progress bar</b> at the top of the floor shows how close you are to the level's target score.
        </div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-hrt">❤️ HEARTS <span class="tut-toggle">[+]</span></div>
      <div class="tut-body" id="tut-hrt" style="display: none;">
        Each level gives you a limited number of hearts. Lose them all — from mismatches
        or letting rectangles hit the floor — and the level ends in <span style="color:#ff3e5e">FAILURE</span>.
        Later levels are stingier: some give only <b>1 heart</b>.
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-wal">🔁 WALL BOUNCING <span class="tut-toggle">[+]</span></div>
      <div class="tut-body" id="tut-wal" style="display: none;">
        Bullets bounce off the <b>left, right, and top walls</b> — up to <b>${BOUNCE_LIMIT} bounces</b> per shot.
        Use this to reach rectangles hiding near the edges or behind others.
        The aim guide previews the full bounce path before you shoot.
      </div>
    </div>

    <div class="tut-section" style="margin-bottom:0">
      <div class="tut-heading closed" data-target="tut-lvl">📈 LEVELS <span class="tut-toggle">[+]</span></div>
      <div id="tut-lvl" style="display: none;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;max-width:360px;margin:6px auto 0">
          ${LEVELS.map((l, i) => `
            <div style="background:#111128;border:1px solid #222;border-radius:6px;padding:6px 8px;text-align:center">
              <div style="font-family:'Orbitron',sans-serif;font-size:0.65rem;color:#ffd700">LV ${i + 1}</div>
              <div style="font-size:0.55rem;color:#666;letter-spacing:0.1em;margin:2px 0">${l.title}</div>
              <div style="font-size:0.55rem;color:#444">${l.heartsAllowed}❤ · ${l.targetScore}pts</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    </div> <!-- Close scrollable container -->

    <div style="flex-shrink:0;width:100%;display:flex;justify-content:center;padding-top:16px;border-top:1px solid #ffffff11;">
      <button class="btn" id="btn-tut-back">← BACK TO MENU</button>
    </div>
  `;

  // General click delegation handler for both the Accordion headers and the Back button
  el.addEventListener('click', e => {
    const heading = e.target.closest('.tut-heading');
    if (heading) {
      const targetId = heading.dataset.target;
      const targetEl = el.querySelector('#' + targetId);
      const toggleSpan = heading.querySelector('.tut-toggle');

      if (targetEl.style.display === 'none') {
        // Enforce accordion auto-collapse rules
        const allowedGroup = ['tut-obj', 'tut-ctrl'];
        const targetInGroup = allowedGroup.includes(targetId);

        el.querySelectorAll('.tut-heading').forEach(hd => {
          const otherId = hd.dataset.target;
          if (otherId === targetId) return;

          // Close others unless both the target and the other section belong to the allowed group
          if (!(targetInGroup && allowedGroup.includes(otherId))) {
            const otherEl = el.querySelector('#' + otherId);
            if (otherEl.style.display !== 'none') {
              otherEl.style.display = 'none';
              hd.classList.replace('open', 'closed');
              hd.querySelector('.tut-toggle').textContent = '[+]';
            }
          }
        });

        targetEl.style.display = 'block';
        heading.classList.replace('closed', 'open');
        toggleSpan.textContent = '[-]';
      } else {
        targetEl.style.display = 'none';
        heading.classList.replace('open', 'closed');
        toggleSpan.textContent = '[+]';
      }
      return;
    }

    if (e.target.closest('#btn-tut-back')) {
      hideAllOverlays();
      showStartOverlay();
    }
  });
}

export function showResultOverlay(success) {
  const el = makeOverlay();
  const cfg = LEVELS[state.levelIdx];
  const isLast = state.levelIdx >= LEVELS.length - 1;
  const colorStats = COLORS.map((c, i) => `
    <div class="stat-row">
      <span class="stat-key"><span class="color-dot" style="background:${c.hex}"></span>${c.name}</span>
      <span class="stat-val">${state.stats.correct[i]}</span>
    </div>`).join('');

  if (success) {
    el.innerHTML = `
      <h1 style="color:#00e5ff">LEVEL CLEAR</h1>
      <div id="level-badge" style="color:#ffd700">LV ${state.levelIdx + 1} — ${cfg.title}</div>
      <div class="stat-grid">
        ${colorStats}
        <div class="stat-row"><span class="stat-key">Mismatches</span><span class="stat-val" style="color:#ff3e5e">${state.mismatches}</span></div>
        <div class="stat-row"><span class="stat-key">Score</span><span class="stat-val">${state.score}</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" id="btn-map" style="font-size:0.7rem;padding:8px 18px">⊞ MAP</button>
        <button class="btn" id="btn-next">${isLast ? '▶ VICTORY!' : '▶ NEXT LEVEL'}</button>
      </div>
    `;
    document.getElementById('btn-next').onclick = () => {
      if (isLast) showWinOverlay();
      else startLevel(state.levelIdx + 1);
    };
    document.getElementById('btn-map').onclick = () => {
      state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay();
    };
  } else {
    el.innerHTML = `
      <h1 style="color:#ff3e5e">LEVEL FAILED</h1>
      <div id="level-badge" style="color:#888">LV ${state.levelIdx + 1} — ${cfg.title}</div>
      <div class="stat-grid">
        ${colorStats}
        <div class="stat-row"><span class="stat-key">Mismatches</span><span class="stat-val" style="color:#ff3e5e">${state.mismatches}</span></div>
        <div class="stat-row"><span class="stat-key">Survived</span><span class="stat-val">${state.stats.survived}s</span></div>
        <div class="stat-row"><span class="stat-key">Score</span><span class="stat-val">${state.score}</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" id="btn-map" style="font-size:0.7rem;padding:8px 18px">⊞ MAP</button>
        <button class="btn" id="btn-retry">↺ RETRY</button>
      </div>
    `;
    document.getElementById('btn-retry').onclick = () => { state.score = 0; startLevel(state.levelIdx); };
    document.getElementById('btn-map').onclick = () => { state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay(); };
  }
}

export function showWinOverlay() {
  state.status = 'win';
  const el = makeOverlay();
  el.innerHTML = `
    <h1 style="color:#ffd700;font-size:2.5rem">VICTORY</h1>
    <h2 style="color:#aaa">ALL LEVELS CONQUERED</h2>
    <div style="font-size:2rem;font-family:'Orbitron',sans-serif;color:#00e5ff">${state.score}</div>
    <div style="color:#555;font-size:0.7rem">FINAL SCORE</div>
    <button class="btn" id="btn-menu2">⌂ MAIN MENU</button>
  `;
  document.getElementById('btn-menu2').onclick = () => { state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay(); };
}
