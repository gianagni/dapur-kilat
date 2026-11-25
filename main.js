// Dapur Kilat: boot and the one loop. Input is read every frame, the kitchen
// advances in fixed 1/60 s steps, and the renderer paints what is there. The
// game moves between five screens: title, playing, paused, shift complete and
// game over.
//
// ?shot=kitchen|assembly|rush|serve stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
// ?seed=N fixes the order deck for a normal run.
import { FIELD, INGREDIENTS, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput, KEY_CONFIRM, KEY_MUTE, KEY_PAUSE, KEY_RESTART, binRect, buttonRect, hitRect, stationRect, ticketRect } from './input.js';
import { drawGame } from './render.js';
import { shotSeed, stageShot } from './shots.js';
import {
  EVENT_BURN, EVENT_CHOP, EVENT_COOK, EVENT_ERROR, EVENT_LOST, EVENT_PICK, EVENT_PLATE, EVENT_SERVE, EVENT_SHIFT,
  SCREEN_COMPLETE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
  createGame, nextShift, pickBin, serveTicket, startGame, updateGame, usePlate, useStation,
} from './state.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : (shot ? shotSeed(shot) : Math.floor(Math.random() * 4294967296));

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createGame(seed);
const audio = createAudio();
// Test hook: the live state is readable from the console for play-testing.
window.__dapur = state;

/** Size the canvas to its logical field and keep it sharp on dense screens. */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const width = Math.floor(FIELD.width * scale);
  const height = Math.floor(FIELD.height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = FIELD.width * ratio;
  canvas.height = FIELD.height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

const ctx = fitCanvas();
window.addEventListener('resize', () => {
  const fresh = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  fresh.setTransform(ratio, 0, 0, ratio, 0, 0);
  fitCanvas();
});

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem('dapur-kilat-best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('dapur-kilat-best', String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

state.best = readBest();

function playEvents(events) {
  if (events & EVENT_SERVE) audio.serve();
  else if (events & EVENT_LOST) audio.lost();
  else if (events & EVENT_ERROR) audio.error();
  else if (events & EVENT_BURN) audio.error();
  else if (events & EVENT_PLATE) audio.plate();
  else if (events & EVENT_CHOP) audio.chop();
  else if (events & EVENT_COOK) audio.sizzle();
  else if (events & EVENT_PICK) audio.pick();
  if (events & EVENT_SHIFT) audio.serve();
}

/** The Space key does the obvious thing for whatever the hand holds: chop what
 *  can be chopped, cook what can be cooked, grill what can be grilled, and
 *  otherwise put it on the plate. */
function confirmAction() {
  if (state.screen !== SCREEN_PLAY) return;
  const held = state.held;
  if (!held) {
    usePlate(state);
    return;
  }
  const ingredient = INGREDIENTS.find((entry) => entry.id === held.id);
  if (!ingredient) return;
  let events = 0;
  if (ingredient.chop && held.stage === 'raw') events = useStation(state, 'chop');
  else if (ingredient.cook === 'wok' && held.stage !== 'cooked' && held.stage !== 'grilled') events = useStation(state, 'wok');
  else if (ingredient.grill && held.stage === 'raw') events = useStation(state, 'grill');
  else events = usePlate(state);
  playEvents(events);
}

function runShot(name) {
  stageShot(name, state);
  let painted = 0;
  function paint() {
    drawGame(ctx, state, { x: FIELD.width / 2, y: FIELD.height / 2, inside: false });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function endRun() {
    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }
    announce(`Selesai. Skor ${state.score}. Koin ${state.coins}.`);
  }

  function handleClicks() {
    for (const point of input.takeClicks()) {
      audio.unlock();
      if (state.screen === SCREEN_TITLE) {
        if (hitRect(point.x, point.y, buttonRect())) {
          startGame(state);
          announce('Masak! Ambil bahan dari meja.');
        }
        continue;
      }
      if (state.screen === SCREEN_COMPLETE) {
        if (hitRect(point.x, point.y, buttonRect())) {
          const events = nextShift(state);
          playEvents(events);
          if (state.screen === SCREEN_OVER) endRun();
        }
        continue;
      }
      if (state.screen === SCREEN_OVER) {
        if (hitRect(point.x, point.y, buttonRect())) {
          startGame(state);
          announce('Masak! Ambil bahan dari meja.');
        }
        continue;
      }
      if (state.screen === SCREEN_PAUSED) {
        state.screen = SCREEN_PLAY;
        announce('Lanjut masak.');
        continue;
      }
      if (state.screen !== SCREEN_PLAY) continue;

      let handled = false;
      state.orders.forEach((order, index) => {
        if (!handled && hitRect(point.x, point.y, ticketRect(index))) {
          playEvents(serveTicket(state, order.id));
          handled = true;
        }
      });
      if (handled) continue;
      for (const name of ['chop', 'wok', 'grill']) {
        if (hitRect(point.x, point.y, stationRect(name))) {
          playEvents(useStation(state, name));
          handled = true;
          break;
        }
      }
      if (handled) continue;
      if (hitRect(point.x, point.y, stationRect('plate'))) {
        playEvents(usePlate(state));
        continue;
      }
      INGREDIENTS.forEach((_, index) => {
        if (hitRect(point.x, point.y, binRect(index))) playEvents(pickBin(state, index));
      });
    }
  }

  function handleKeys() {
    for (const code of input.takeKeys()) {
      audio.unlock();
      if (code === KEY_MUTE) {
        state.muted = !state.muted;
        audio.setMuted(state.muted);
        announce(state.muted ? 'Suara mati.' : 'Suara hidup.');
        continue;
      }
      if (code === KEY_RESTART && (state.screen === SCREEN_OVER || state.screen === SCREEN_COMPLETE || state.screen === SCREEN_PLAY)) {
        startGame(state);
        announce('Masak! Ambil bahan dari meja.');
        continue;
      }
      if (code === KEY_PAUSE && state.screen === SCREEN_PLAY) {
        state.screen = SCREEN_PAUSED;
        announce('Jeda.');
        continue;
      }
      if (code === KEY_PAUSE && state.screen === SCREEN_PAUSED) {
        state.screen = SCREEN_PLAY;
        announce('Lanjut masak.');
        continue;
      }
      if (code === KEY_CONFIRM) {
        if (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER) {
          startGame(state);
          announce('Masak! Ambil bahan dari meja.');
        } else if (state.screen === SCREEN_COMPLETE) {
          const events = nextShift(state);
          playEvents(events);
          if (state.screen === SCREEN_OVER) endRun();
        } else if (state.screen === SCREEN_PAUSED) {
          state.screen = SCREEN_PLAY;
        } else {
          confirmAction();
        }
        continue;
      }
      if (code.startsWith('Digit')) {
        const index = Number.parseInt(code.slice(5), 10) - 1;
        if (state.screen === SCREEN_PLAY && index >= 0 && index < INGREDIENTS.length) {
          playEvents(pickBin(state, index));
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClicks();
    handleKeys();
    if (state.screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const events = updateGame(state, STEP);
        playEvents(events);
        accumulator -= STEP;
        if (state.screen === SCREEN_COMPLETE || state.screen === SCREEN_OVER) {
          endRun();
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    drawGame(ctx, state, input.mouse);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Dapur Kilat. Klik MULAI MASAK atau tekan Spasi.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
