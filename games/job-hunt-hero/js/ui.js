import { COLORS, LEVELS, BOUNCE_LIMIT, GAME_TITLE, GAME_SUBTITLE, GAME_DESC, TUTORIAL_TITLE, UI_TEXT } from './constants.js';
import { state } from './state.js';
import { loadProgress, highestUnlocked } from './utils.js';
import { startLevel } from './engine.js';
import { playLobbyMusic, toggleMusicMute, toggleSfxMute, isMusicMuted, isSfxMuted, resumePendingMusic } from './audio.js';
import { startMenuAnimation, stopMenuAnimation } from './menuCanvas.js';

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

function injectAudioButtons(el) {
  const wrap = document.createElement('div');
  wrap.className = 'audio-btns';

  const musicBtn = document.createElement('button');
  musicBtn.className = 'mute-btn';
  musicBtn.title = 'Toggle music';
  musicBtn.textContent = isMusicMuted ? '🔇' : '🎵';
  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    musicBtn.textContent = toggleMusicMute() ? '🔇' : '🎵';
  });

  const sfxBtn = document.createElement('button');
  sfxBtn.className = 'mute-btn';
  sfxBtn.title = 'Toggle sound effects';
  sfxBtn.textContent = isSfxMuted ? '🔇' : '🔊';
  sfxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sfxBtn.textContent = toggleSfxMute() ? '🔇' : '🔊';
  });

  wrap.appendChild(musicBtn);
  wrap.appendChild(sfxBtn);
  el.appendChild(wrap);
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
  playLobbyMusic();
  const el = makeOverlay();

  // ── Animated background canvas ──────────────────────────────────────────
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = el.parentElement?.offsetWidth || 520;
  bgCanvas.height = el.parentElement?.offsetHeight || 580;
  bgCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  el.appendChild(bgCanvas);
  startMenuAnimation(bgCanvas);

  // ── GIF character at bottom ─────────────────────────────────────────────
  const gif = document.createElement('img');
  gif.src = 'assets/background-player.gif';
  gif.className = 'menu-gif';
  el.appendChild(gif);

  // ── Content wrapper (z above canvas) ────────────────────────────────────
  const content = document.createElement('div');
  content.className = 'menu-content';
  el.appendChild(content);

  const progress = loadProgress();
  const maxUnlocked = highestUnlocked();
  const anyProgress = progress.some(p => p.cleared || p.bestScore > 0);

  const mapSection = anyProgress
    ? `<div class="map-title">${UI_TEXT.SELECT_LEVEL}</div>${buildLevelMapHTML(progress, maxUnlocked)}`
    : `<h2 style="margin-bottom:2px">${GAME_SUBTITLE}</h2>
       <div style="font-size:1rem;color:#555;text-align:center;line-height:1.9;max-width:300px">
         ${GAME_DESC}<br>
         <span style="color:#ff3e5e">${UI_TEXT.MISMATCH_WARNING}</span><br>
         ${UI_TEXT.START_HINT}
       </div>
       <div style="display:flex;gap:12px;margin:2px 0;font-size:0.75rem">
         ${COLORS.map(c => `<span><span class="color-dot" style="background:${c.hex}"></span>${c.name}</span>`).join('')}
       </div>`;

  content.innerHTML = `
    <h1 style="color:#fff;font-size:1.5rem;margin-bottom:0">${GAME_TITLE}</h1>
    ${mapSection}
    <div style="display:flex;gap:10px;margin-top:${anyProgress ? '4px' : '0'}">
      ${anyProgress ? `<button class="btn" id="btn-new-game" style="font-size:0.7rem;padding:8px 16px">${UI_TEXT.BTN_NEW_GAME}</button>` : ''}
      <button class="btn" id="btn-tutorial" style="font-size:0.7rem;padding:8px 16px">${UI_TEXT.BTN_TUTORIAL}</button>
      <button class="btn" id="btn-start">${anyProgress ? UI_TEXT.BTN_CONTINUE : UI_TEXT.BTN_START}</button>
    </div>
  `;
  injectAudioButtons(el);

  el.addEventListener('click', e => {
    resumePendingMusic(); // flush any autoplay-blocked track on first gesture
    const t = e.target.closest('button, .map-node');
    if (!t) return;

    if (t.id === 'btn-start') {
      stopMenuAnimation();
      state.score = 0;
      startLevel(maxUnlocked);

    } else if (t.id === 'btn-tutorial') {
      hideAllOverlays(); showTutorialOverlay();

    } else if (t.id === 'btn-new-game') {
      el.innerHTML = `
        <h1 style="color:#ff3e5e;font-size:1.4rem">${UI_TEXT.RESET_TITLE}</h1>
        <div style="font-size:0.75rem;color:#888;text-align:center;line-height:1.8">${UI_TEXT.RESET_BODY}</div>
        <div style="display:flex;gap:12px">
          <button class="btn" id="btn-confirm-no"  style="border-color:#333;color:#666">${UI_TEXT.RESET_CANCEL}</button>
          <button class="btn" id="btn-confirm-yes" style="border-color:#ff3e5e55;color:#ff3e5e">${UI_TEXT.RESET_CONFIRM}</button>
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
      stopMenuAnimation();
      state.score = 0;
      startLevel(parseInt(t.dataset.idx));
    }
  });
}

export function showTutorialOverlay() {
  playLobbyMusic();
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
        <div class="tut-heading open" data-target="tut-obj">${UI_TEXT.TUT_OBJ_HEADING} <span class="tut-toggle">[-]</span></div>
        <div class="tut-body" id="tut-obj">${UI_TEXT.TUT_OBJ_TEXT}</div>
      </div>

    <div class="tut-section">
      <div class="tut-heading open" data-target="tut-ctrl">${UI_TEXT.TUT_CTRL_HEADING} <span class="tut-toggle">[-]</span></div>
      <div class="tut-controls" id="tut-ctrl">
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>${UI_TEXT.TUT_CTRL_AIM_KEY}</kbd></div>
          <div class="tut-desc">${UI_TEXT.TUT_CTRL_AIM_DESC}</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>${UI_TEXT.TUT_CTRL_SHOOT_KEY}</kbd></div>
          <div class="tut-desc">${UI_TEXT.TUT_CTRL_SHOOT_DESC}</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>${UI_TEXT.TUT_CTRL_LEFT_KEY}</kbd></div>
          <div class="tut-desc">${UI_TEXT.TUT_CTRL_LEFT_DESC}</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>${UI_TEXT.TUT_CTRL_RIGHT_KEY}</kbd></div>
          <div class="tut-desc">${UI_TEXT.TUT_CTRL_RIGHT_DESC}</div>
        </div>
        <div class="tut-key-row">
          <div class="tut-keys"><kbd>${UI_TEXT.TUT_CTRL_SCROLL_KEY}</kbd></div>
          <div class="tut-desc">${UI_TEXT.TUT_CTRL_SCROLL_DESC}</div>
        </div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-col">${UI_TEXT.TUT_COL_HEADING} <span class="tut-toggle">[+]</span></div>
      <div id="tut-col" style="display: none;">
        <div class="tut-body" style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center">
          ${COLORS.map(c => `
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:28px;height:16px;border-radius:4px;background:${c.hex};box-shadow:0 0 8px ${c.hex}88"></div>
              <span style="color:${c.hex};font-size:0.8rem;letter-spacing:0.1em">${c.name}</span>
            </div>`).join('')}
        </div>
        <div class="tut-body" style="margin-top:8px">${UI_TEXT.TUT_COL_DESC}</div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-sco">${UI_TEXT.TUT_SCO_HEADING} <span class="tut-toggle">[+]</span></div>
      <div id="tut-sco" style="display: none;">
        <div class="tut-controls">
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#2ecc71">${UI_TEXT.TUT_SCO_HIT}</div>
            <div class="tut-desc">${UI_TEXT.TUT_SCO_HIT_DESC}</div>
          </div>
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#ff3e5e">${UI_TEXT.TUT_SCO_MISS}</div>
            <div class="tut-desc">${UI_TEXT.TUT_SCO_MISS_DESC}</div>
          </div>
          <div class="tut-key-row">
            <div class="tut-keys" style="color:#ff3e5e">${UI_TEXT.TUT_SCO_FLOOR}</div>
            <div class="tut-desc">${UI_TEXT.TUT_SCO_FLOOR_DESC}</div>
          </div>
        </div>
        <div class="tut-body" style="margin-top:6px">${UI_TEXT.TUT_SCO_BAR}</div>
      </div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-hrt">${UI_TEXT.TUT_HRT_HEADING} <span class="tut-toggle">[+]</span></div>
      <div class="tut-body" id="tut-hrt" style="display: none;">${UI_TEXT.TUT_HRT_DESC}</div>
    </div>

    <div class="tut-section">
      <div class="tut-heading closed" data-target="tut-wal">${UI_TEXT.TUT_WAL_HEADING} <span class="tut-toggle">[+]</span></div>
      <div class="tut-body" id="tut-wal" style="display: none;">${UI_TEXT.TUT_WAL_DESC} Up to <b>${BOUNCE_LIMIT} bounces</b> per shot.</div>
    </div>

    <div class="tut-section" style="margin-bottom:0">
      <div class="tut-heading closed" data-target="tut-lvl">${UI_TEXT.TUT_LVL_HEADING} <span class="tut-toggle">[+]</span></div>
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
      <button class="btn" id="btn-tut-back">${UI_TEXT.BTN_BACK}</button>
    </div>
  `;
  injectAudioButtons(el);

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
  playLobbyMusic();
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
      <h1 style="color:#00e5ff">${UI_TEXT.RESULT_CLEAR}</h1>
      <div id="level-badge" style="color:#ffd700">LV ${state.levelIdx + 1} — ${cfg.title}</div>
      <div class="stat-grid">
        ${colorStats}
        <div class="stat-row"><span class="stat-key">${UI_TEXT.RESULT_MISMATCHES}</span><span class="stat-val" style="color:#ff3e5e">${state.mismatches}</span></div>
        <div class="stat-row"><span class="stat-key">${UI_TEXT.RESULT_SCORE}</span><span class="stat-val">${state.score}</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" id="btn-map" style="font-size:0.7rem;padding:8px 18px">${UI_TEXT.BTN_MAP}</button>
        <button class="btn" id="btn-next">${isLast ? UI_TEXT.BTN_VICTORY : UI_TEXT.BTN_NEXT}</button>
      </div>
    `;
    injectAudioButtons(el);
    document.getElementById('btn-next').onclick = () => {
      if (isLast) showWinOverlay();
      else startLevel(state.levelIdx + 1);
    };
    document.getElementById('btn-map').onclick = () => {
      state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay();
    };
  } else {
    el.innerHTML = `
      <h1 style="color:#ff3e5e">${UI_TEXT.RESULT_FAIL}</h1>
      <div id="level-badge" style="color:#888">LV ${state.levelIdx + 1} — ${cfg.title}</div>
      <div class="stat-grid">
        ${colorStats}
        <div class="stat-row"><span class="stat-key">${UI_TEXT.RESULT_MISMATCHES}</span><span class="stat-val" style="color:#ff3e5e">${state.mismatches}</span></div>
        <div class="stat-row"><span class="stat-key">${UI_TEXT.RESULT_SURVIVED}</span><span class="stat-val">${state.stats.survived}s</span></div>
        <div class="stat-row"><span class="stat-key">${UI_TEXT.RESULT_SCORE}</span><span class="stat-val">${state.score}</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" id="btn-map" style="font-size:0.7rem;padding:8px 18px">${UI_TEXT.BTN_MAP}</button>
        <button class="btn" id="btn-retry">${UI_TEXT.BTN_RETRY}</button>
      </div>
    `;
    injectAudioButtons(el);
    document.getElementById('btn-retry').onclick = () => { state.score = 0; startLevel(state.levelIdx); };
    document.getElementById('btn-map').onclick = () => { state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay(); };
  }
}

export function showWinOverlay() {
  playLobbyMusic();
  state.status = 'win';
  const el = makeOverlay();
  el.innerHTML = `
    <h1 style="color:#ffd700;font-size:2.5rem">${UI_TEXT.WIN_TITLE}</h1>
    <h2 style="color:#aaa">${UI_TEXT.WIN_SUBTITLE}</h2>
    <div style="font-size:2rem;font-family:'Orbitron',sans-serif;color:#00e5ff">${state.score}</div>
    <div style="color:#555;font-size:0.7rem">${UI_TEXT.WIN_LABEL}</div>
    <button class="btn" id="btn-menu2">${UI_TEXT.BTN_MAIN_MENU}</button>
  `;
  injectAudioButtons(el);
  document.getElementById('btn-menu2').onclick = () => { state.score = 0; state.status = 'start'; hideAllOverlays(); showStartOverlay(); };
}
