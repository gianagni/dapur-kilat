// Dapur Kilat: the four deterministic screenshot scenes behind ?shot=kitchen|
// assembly|rush|serve. Each one builds a fixed kitchen by hand (no random draws,
// no clock), so the same query always paints the same frame.

import { DISHES, SHIFT_SECONDS } from './config.js';
import { SCREEN_PLAY } from './state.js';

function findDish(id) {
  return DISHES.find((dish) => dish.id === id);
}

function makeOrder(id, dishId, patienceShare) {
  const dish = findDish(dishId);
  return { id, dish, patience: 48 * patienceShare, maxPatience: 48 };
}

function baseKitchen(state) {
  state.screen = SCREEN_PLAY;
  state.orders = [];
  state.plate = [];
  state.plateSelected = false;
  state.held = null;
  state.stations.chop = { item: null, progress: 0, done: false, burn: 0, burnt: false };
  state.stations.wok = { item: null, progress: 0, done: false, burn: 0, burnt: false };
  state.stations.grill = { item: null, progress: 0, done: false, burn: 0, burnt: false };
  state.pops = [];
  state.message = '';
  state.messageTimer = 0;
  state.combo = 0;
}

/**
 * Stage the named scene on `state` (kitchen, assembly, rush, serve; anything
 * else is kitchen) and return the screen to draw.
 */
export function stageShot(name, state) {
  baseKitchen(state);
  if (name === 'assembly') {
    state.shift = 1;
    state.shiftTimeLeft = 132;
    state.coins = 210;
    state.score = 640;
    state.combo = 3;
    state.orders = [makeOrder(7, 'mie-ayam', 0.62), makeOrder(8, 'nasi-goreng', 0.8), makeOrder(9, 'sate-ayam', 0.45)];
    state.plate = ['noodles:cooked', 'chicken:cooked'];
    state.stations.wok = { item: { id: 'noodles', stage: 'raw' }, progress: 0.6, done: false, burn: 0, burnt: false };
    state.stations.chop = { item: { id: 'veg', stage: 'raw' }, progress: 0.4, done: false, burn: 0, burnt: false };
    state.held = { id: 'veg', stage: 'raw' };
    return SCREEN_PLAY;
  }
  if (name === 'rush') {
    state.shift = 2;
    state.shiftTimeLeft = 25;
    state.coins = 480;
    state.score = 1420;
    state.combo = 5;
    state.bestCombo = 6;
    state.served = 14;
    state.orders = [
      makeOrder(11, 'nasi-goreng', 0.18),
      makeOrder(12, 'mie-ayam', 0.26),
      makeOrder(13, 'sate-ayam', 0.14),
      makeOrder(14, 'gado-gado', 0.32),
    ];
    state.plate = ['rice:cooked'];
    state.stations.wok = { item: { id: 'egg', stage: 'raw' }, progress: 0.85, done: false, burn: 0, burnt: false };
    state.stations.grill = { item: { id: 'skewer', stage: 'raw' }, progress: 0.5, done: false, burn: 0, burnt: false };
    state.message = 'Rame! Empat pesanan menunggu';
    state.messageTimer = 60;
    return SCREEN_PLAY;
  }
  if (name === 'serve') {
    state.shift = 1;
    state.shiftTimeLeft = 100;
    state.coins = 320;
    state.score = 980;
    state.combo = 4;
    state.served = 9;
    state.orders = [makeOrder(21, 'gado-gado', 0.55), makeOrder(22, 'nasi-goreng', 0.7), makeOrder(23, 'mie-ayam', 0.4)];
    state.plate = ['veg:chopped', 'egg:cooked', 'peanut'];
    state.plateSelected = true;
    state.pops = [
      { x: 780, y: 330, text: '+44', life: 1 },
      { x: 840, y: 300, text: '+44', life: 0.8 },
    ];
    state.message = 'Gado-Gado siap! Klik tiket untuk antar';
    state.messageTimer = 60;
    return SCREEN_PLAY;
  }
  state.shift = 1;
  state.shiftTimeLeft = 130;
  state.coins = 120;
  state.score = 350;
  state.combo = 2;
  state.served = 4;
  state.orders = [makeOrder(1, 'nasi-goreng', 0.72), makeOrder(2, 'mie-ayam', 0.58), makeOrder(3, 'sate-ayam', 0.8)];
  state.plate = ['rice:cooked', 'egg:cooked'];
  state.stations.wok = { item: { id: 'noodles', stage: 'raw' }, progress: 0.45, done: false, burn: 0, burnt: false };
  state.stations.chop = { item: { id: 'chicken', stage: 'raw' }, progress: 0.3, done: false, burn: 0, burnt: false };
  state.held = { id: 'sauce', stage: 'raw' };
  return SCREEN_PLAY;
}

export function shotSeed(name) {
  const seeds = { kitchen: 11, assembly: 22, rush: 33, serve: 44 };
  return seeds[name] ?? 11;
}

export { SHIFT_SECONDS };
