// Dapur Kilat: the game state, orders, timers, stations, plate and scoring.
// Nothing here draws or listens; it only holds the kitchen and moves it forward.

import { DISHES, INGREDIENTS, MAX_LOST, PROCESS, SCORE, SHIFT_SECONDS, SHIFTS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'playing';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_COMPLETE = 'complete';
export const SCREEN_OVER = 'over';

export const EVENT_PICK = 1;
export const EVENT_CHOP = 2;
export const EVENT_COOK = 4;
export const EVENT_PLATE = 8;
export const EVENT_SERVE = 16;
export const EVENT_LOST = 32;
export const EVENT_ERROR = 64;
export const EVENT_BURN = 128;
export const EVENT_SHIFT = 256;

/** A small seeded random generator, so a fixed seed always deals the same orders. */
export function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A held or plated item: a base ingredient plus how far it has been processed. */
export function itemKey(item) {
  return item.stage === 'raw' ? item.id : `${item.id}:${item.stage}`;
}

export function itemLabel(item) {
  const base = INGREDIENTS.find((entry) => entry.id === item.id);
  const suffix = item.stage === 'raw' ? '' : PROCESS[item.stage].suffix;
  return (base ? base.name : item.id) + suffix;
}

function newStation() {
  return { item: null, progress: 0, done: false, burn: 0, burnt: false };
}

/** A fresh kitchen: title screen, shift 1, no orders yet, no coins. */
export function createGame(seed) {
  return {
    screen: SCREEN_TITLE,
    seed,
    random: mulberry32(seed),
    shift: 1,
    shiftTimeLeft: SHIFT_SECONDS,
    orders: [],
    nextOrderId: 1,
    spawnTimer: 2,
    held: null,
    stations: { chop: newStation(), wok: newStation(), grill: newStation() },
    plate: [],
    plateSelected: false,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    lost: 0,
    pops: [],
    message: '',
    messageTimer: 0,
    muted: false,
    best: 0,
  };
}

function shiftConfig(state) {
  return SHIFTS[Math.min(state.shift, SHIFTS.length) - 1];
}

function pickDish(state) {
  const index = Math.floor(state.random() * DISHES.length);
  return DISHES[index];
}

/** Deal one new order ticket onto the board, if the shift still has room. */
export function spawnOrder(state) {
  const config = shiftConfig(state);
  if (state.orders.length >= config.orders) return false;
  const dish = pickDish(state);
  state.orders.push({
    id: state.nextOrderId,
    dish,
    patience: config.patience,
    maxPatience: config.patience,
  });
  state.nextOrderId += 1;
  return true;
}

function sameRecipe(plate, recipe) {
  if (plate.length !== recipe.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedRecipe = [...recipe].sort();
  return sortedPlate.every((key, index) => key === sortedRecipe[index]);
}

function coinPop(state, x, y, text) {
  state.pops.push({ x, y, text, life: 1 });
}

/** Start a fresh shift: clear the board, refill the timer, deal the first orders. */
export function startShift(state) {
  state.orders = [];
  state.plate = [];
  state.plateSelected = false;
  state.held = null;
  state.stations = { chop: newStation(), wok: newStation(), grill: newStation() };
  state.shiftTimeLeft = SHIFT_SECONDS;
  state.spawnTimer = 1.5;
  state.combo = 0;
  spawnOrder(state);
  spawnOrder(state);
}

/** Begin a run from the title screen. */
export function startGame(state) {
  state.shift = 1;
  state.coins = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.served = 0;
  state.lost = 0;
  state.pops = [];
  state.screen = SCREEN_PLAY;
  startShift(state);
}

/** Move to the next shift, or end the run when the last shift is done. */
export function nextShift(state) {
  if (state.shift >= SHIFTS.length) {
    state.screen = SCREEN_OVER;
    return EVENT_SHIFT;
  }
  state.shift += 1;
  state.screen = SCREEN_PLAY;
  startShift(state);
  return EVENT_SHIFT;
}

/** Pick an ingredient up from a counter bin (the hand holds one thing at a time). */
export function pickBin(state, index) {
  const ingredient = INGREDIENTS[index];
  if (!ingredient) return 0;
  state.held = { id: ingredient.id, stage: 'raw' };
  state.plateSelected = false;
  return EVENT_PICK;
}

/**
 * Use a processing station. With an item in hand that the station can take, the
 * item goes in and starts. With a finished item inside and an empty hand, the
 * player takes it out. A burnt item is cleared with a click.
 */
export function useStation(state, name) {
  const station = state.stations[name];
  const held = state.held;
  if (station.item && station.done && !station.burnt && !held) {
    state.held = station.item;
    state.stations[name] = newStation();
    return station.item.stage === 'cooked' || station.item.stage === 'grilled' ? EVENT_COOK : EVENT_CHOP;
  }
  if (station.item && station.burnt) {
    state.stations[name] = newStation();
    return EVENT_BURN;
  }
  if (!station.item && held) {
    const ingredient = INGREDIENTS.find((entry) => entry.id === held.id);
    if (!ingredient) return EVENT_ERROR;
    if (name === 'chop' && ingredient.chop && held.stage === 'raw') {
      station.item = held;
      station.progress = 0;
      state.held = null;
      return EVENT_CHOP;
    }
    if (name === 'wok' && ingredient.cook === 'wok' && held.stage !== 'cooked' && held.stage !== 'grilled') {
      station.item = held;
      station.progress = 0;
      state.held = null;
      return EVENT_COOK;
    }
    if (name === 'grill' && ingredient.grill && held.stage === 'raw') {
      station.item = held;
      station.progress = 0;
      state.held = null;
      return EVENT_COOK;
    }
    return EVENT_ERROR;
  }
  return 0;
}

/**
 * Use the plating station. With an item in hand it goes onto the plate (once each).
 * With an empty hand it arms the plate, so the next ticket click serves it.
 */
export function usePlate(state) {
  if (state.held) {
    const key = itemKey(state.held);
    if (state.plate.length >= 4 || state.plate.includes(key)) return EVENT_ERROR;
    state.plate.push(key);
    state.held = null;
    state.plateSelected = false;
    return EVENT_PLATE;
  }
  if (state.plate.length > 0) {
    state.plateSelected = !state.plateSelected;
    return EVENT_PICK;
  }
  return 0;
}

/** Try to serve the armed plate to a ticket. A match pays; a miss buzzes. */
export function serveTicket(state, ticketId) {
  const order = state.orders.find((entry) => entry.id === ticketId);
  if (!order || !state.plateSelected) return 0;
  if (!sameRecipe(state.plate, order.dish.recipe)) {
    state.message = 'Piring ini bukan resepnya';
    state.messageTimer = 1.6;
    return EVENT_ERROR;
  }
  const patienceShare = order.patience / order.maxPatience;
  const speedBonus = Math.round(SCORE.speedBonus * patienceShare);
  const comboBonus = state.combo * SCORE.comboBonus;
  const earned = order.dish.price + speedBonus + comboBonus;
  state.coins += earned;
  state.score += earned;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  state.orders = state.orders.filter((entry) => entry.id !== ticketId);
  state.plate = [];
  state.plateSelected = false;
  state.message = `Pesanan selesai! +${earned} koin`;
  state.messageTimer = 1.8;
  coinPop(state, 640, 300, `+${earned}`);
  return EVENT_SERVE;
}

/** Advance every timer by dt seconds; returns sound events that happened.
 *  Patience drains, stations cook, burnt food waits to be thrown away. */
export function updateGame(state, dt) {
  let events = 0;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  for (const pop of state.pops) {
    pop.life -= dt * 0.7;
    pop.y -= 28 * dt;
  }
  state.pops = state.pops.filter((pop) => pop.life > 0);
  if (state.screen !== SCREEN_PLAY) return events;

  state.shiftTimeLeft -= dt;
  if (state.shiftTimeLeft <= 0) {
    state.shiftTimeLeft = 0;
    state.screen = SCREEN_COMPLETE;
    return EVENT_SHIFT;
  }

  const config = shiftConfig(state);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (spawnOrder(state)) state.spawnTimer = config.spawnEvery;
    else state.spawnTimer = 2;
  }

  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((order) => order.patience <= 0);
  if (expired.length > 0) {
    state.orders = state.orders.filter((order) => order.patience > 0);
    state.lost += expired.length;
    state.combo = 0;
    state.score = Math.max(0, state.score - SCORE.lostPenalty * expired.length);
    state.message = 'Pesanan hangus, pelanggan pergi';
    state.messageTimer = 1.8;
    events |= EVENT_LOST;
    if (state.lost >= MAX_LOST) {
      state.screen = SCREEN_OVER;
      return events;
    }
  }

  for (const [name, station] of Object.entries(state.stations)) {
    if (!station.item || station.done) continue;
    const target = name === 'chop' ? PROCESS.chopped.time : name === 'wok' ? PROCESS.cooked.time : PROCESS.grilled.time;
    station.progress += dt / target;
    if (station.progress >= 1) {
      station.progress = 1;
      station.done = true;
      const stage = name === 'chop' ? 'chopped' : name === 'wok' ? 'cooked' : 'grilled';
      station.item = { id: station.item.id, stage };
      station.burn = 0;
      events |= name === 'chop' ? EVENT_CHOP : EVENT_COOK;
    }
  }
  for (const station of Object.values(state.stations)) {
    if (!station.item || !station.done || station.burnt) continue;
    const burnAfter = station.item.stage === 'chopped' ? Infinity : PROCESS[station.item.stage].burnAfter;
    station.burn += dt;
    if (station.burn > burnAfter) {
      station.burnt = true;
      state.message = 'Hangus! Masakan gosong, klik untuk buang';
      state.messageTimer = 1.6;
      events |= EVENT_BURN;
    }
  }
  return events;
}
