// audio.js — SFX + Music manager · Separate music / sfx mute controls

// ─── STATE ────────────────────────────────────────────────────────────────────
export let isMusicMuted = false;
export let isSfxMuted   = false;

export function toggleMusicMute() {
  isMusicMuted = !isMusicMuted;
  if (isMusicMuted) {
    _lobbyAudio.volume   = 0;
    _gameplayAudio.volume = 0;
  } else {
    if (_currentTrack === 'lobby')    _lobbyAudio.volume   = LOBBY_VOL;
    if (_currentTrack === 'gameplay') _gameplayAudio.volume = GAMEPLAY_VOL;
  }
  return isMusicMuted;
}

export function toggleSfxMute() {
  isSfxMuted = !isSfxMuted;
  return isSfxMuted;
}

// ─── MUSIC ────────────────────────────────────────────────────────────────────
const LOBBY_VOL    = 0.35;
const GAMEPLAY_VOL = 0.45;
const FADE_STEPS   = 20;
const FADE_MS      = 400;

let _currentTrack = null; // 'lobby' | 'gameplay' | null
let _pendingTrack = null; // deferred until first user gesture

const _lobbyAudio = new Audio('assets/loby.wav');
_lobbyAudio.loop  = true;
_lobbyAudio.volume = 0;

const _gameplayAudio = new Audio('assets/gameplay.wav');
_gameplayAudio.loop  = true;
_gameplayAudio.volume = 0;

function _fadeTo(audioEl, targetVol, onDone) {
  const start    = audioEl.volume;
  const delta    = (targetVol - start) / FADE_STEPS;
  const interval = FADE_MS / FADE_STEPS;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    audioEl.volume = Math.max(0, Math.min(1, start + delta * step));
    if (step >= FADE_STEPS) {
      clearInterval(timer);
      audioEl.volume = targetVol;
      if (onDone) onDone();
    }
  }, interval);
}

function _switchTo(track) {
  if (_currentTrack === track) return;

  const incoming  = track === 'lobby' ? _lobbyAudio      : _gameplayAudio;
  const outgoing  = track === 'lobby' ? _gameplayAudio   : _lobbyAudio;
  const targetVol = track === 'lobby' ? LOBBY_VOL        : GAMEPLAY_VOL;

  _currentTrack = track;

  const playPromise = incoming.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        if (!isMusicMuted) _fadeTo(incoming, targetVol);
        _fadeTo(outgoing, 0, () => outgoing.pause());
      })
      .catch(() => {
        // Autoplay blocked — will be retried when overlay gets its first click
        _currentTrack = null;
        _pendingTrack = track;
      });
  }
}

// Called by ui.js on first overlay interaction — flushes any blocked track
export function resumePendingMusic() {
  if (_pendingTrack) {
    const t = _pendingTrack;
    _pendingTrack = null;
    _switchTo(t);
  }
}


export function playLobbyMusic()    { _switchTo('lobby');    }
export function playGameplayMusic() { _switchTo('gameplay'); }

export function stopMusic() {
  _fadeTo(_lobbyAudio,    0, () => _lobbyAudio.pause());
  _fadeTo(_gameplayAudio, 0, () => _gameplayAudio.pause());
  _currentTrack = null;
}

// ─── SFX ─────────────────────────────────────────────────────────────────────
let _ctx = null;

function _audioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function playTone({ type = 'sine', freq = 440, freqEnd = freq, duration = 0.15, volume = 0.25, delay = 0 }) {
  if (isSfxMuted) return;
  const ac   = _audioCtx();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  const t = ac.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration + 0.01);
}

export function playShoot() {
  playTone({ type: 'square',   freq: 280, freqEnd: 520, duration: 0.09, volume: 0.12 });
}
export function playHit() {
  playTone({ type: 'sine',     freq: 520, freqEnd: 880,  duration: 0.12, volume: 0.22 });
  playTone({ type: 'sine',     freq: 660, freqEnd: 1040, duration: 0.14, volume: 0.16, delay: 0.08 });
}
export function playMiss() {
  playTone({ type: 'triangle', freq: 480, freqEnd: 420, duration: 0.14, volume: 0.2  });
  playTone({ type: 'triangle', freq: 340, freqEnd: 260, duration: 0.18, volume: 0.18, delay: 0.10 });
}
export function playWall() {
  playTone({ type: 'sine',     freq: 900, freqEnd: 600, duration: 0.04, volume: 0.06 });
}
