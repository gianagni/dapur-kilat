// Dapur Kilat: every tuning number, dish, recipe and colour in one place.
// The kitchen is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One shift lasts three minutes of play. */
export const SHIFT_SECONDS = 180;

/** How many orders the kitchen may lose before the shift ends in a bust. */
export const MAX_LOST = 5;

/** Ingredients the player can pick from the counter bins. */
export const INGREDIENTS = [
  { id: 'rice', name: 'Nasi', key: '1', color: '#f5f0dc', dark: '#cbbf9a', chop: false, cook: 'wok', grill: false },
  { id: 'noodles', name: 'Mie', key: '2', color: '#f7d774', dark: '#c9a13a', chop: false, cook: 'wok', grill: false },
  { id: 'chicken', name: 'Ayam', key: '3', color: '#f2b28c', dark: '#c07a4e', chop: true, cook: 'wok', grill: false },
  { id: 'egg', name: 'Telur', key: '4', color: '#fff3c4', dark: '#d9b96a', chop: false, cook: 'wok', grill: false },
  { id: 'veg', name: 'Sayur', key: '5', color: '#8ed081', dark: '#4d8a42', chop: true, cook: null, grill: false },
  { id: 'sauce', name: 'Saus', key: '6', color: '#e05b4b', dark: '#a02c20', chop: false, cook: null, grill: false },
  { id: 'skewer', name: 'Sate', key: '7', color: '#d99a5b', dark: '#96602e', chop: false, cook: null, grill: true },
  { id: 'peanut', name: 'Kacang', key: '8', color: '#c98f4e', dark: '#8a5a24', chop: false, cook: null, grill: false },
];

/** A processed ingredient is named by its base id plus a step suffix. */
export const PROCESS = {
  chopped: { suffix: ' (cincang)', time: 1.6 },
  cooked: { suffix: ' (matang)', time: 2.6, burnAfter: 1.6 },
  grilled: { suffix: ' (bakar)', time: 2.2, burnAfter: 1.6 },
};

/**
 * The four dishes. Each recipe lists the processed ingredient ids the plate must
 * hold, in the order the ticket shows them. A plate matches a ticket when it
 * holds exactly that set, in any order.
 */
export const DISHES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    color: '#e8a13a',
    price: 30,
    recipe: ['rice:cooked', 'egg:cooked', 'sauce'],
    steps: ['Nasi wajan', 'Telur wajan', 'Saus'],
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    color: '#e8c93a',
    price: 35,
    recipe: ['noodles:cooked', 'chicken:cooked', 'veg:chopped'],
    steps: ['Mie wajan', 'Ayam wajan', 'Sayur cincang'],
  },
  {
    id: 'sate-ayam',
    name: 'Sate Ayam',
    color: '#c96a3a',
    price: 40,
    recipe: ['skewer:grilled', 'peanut'],
    steps: ['Sate bakar', 'Kacang'],
  },
  {
    id: 'gado-gado',
    name: 'Gado-Gado',
    color: '#7fb069',
    price: 32,
    recipe: ['veg:chopped', 'egg:cooked', 'peanut'],
    steps: ['Sayur cincang', 'Telur wajan', 'Kacang'],
  },
];

/** Per-shift pressure: more orders at once, less patience each shift. */
export const SHIFTS = [
  { orders: 3, patience: 48, spawnEvery: 9 },
  { orders: 4, patience: 38, spawnEvery: 7 },
  { orders: 5, patience: 30, spawnEvery: 5.5 },
];

/** Scoring: a served dish pays its price, plus a speed bonus and a combo bonus. */
export const SCORE = {
  speedBonus: 12,
  comboBonus: 5,
  lostPenalty: 8,
};

/** Layout of the kitchen, in logical pixels. Bins sit in one row of eight; the
 *  hand follows the mouse, so no counter space is spent on a hand slot. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 76, w: 1248, h: 128 },
  ticket: { w: 236, h: 112, gap: 16 },
  stations: { x: 16, y: 220, w: 1248, h: 300 },
  station: { w: 288, h: 260, gap: 32 },
  counter: { x: 16, y: 540, w: 1248, h: 180 },
  bin: { w: 138, h: 150, gap: 20 },
  hand: { x: 1080, y: 540, w: 184, h: 180 },
};

/** Palette: a warm warung kitchen, dark wood, brass and chilli red. */
export const COLORS = {
  wall: '#3a2a1e',
  wallTop: '#4a3626',
  floor: '#2b1d12',
  wood: '#8a5a2b',
  woodDark: '#6b4420',
  brass: '#d9a441',
  cream: '#fff6e0',
  ink: '#241608',
  red: '#d9452f',
  green: '#5da24a',
  gold: '#f2c14e',
  ticket: '#fff8e6',
  ticketEdge: '#d9c48f',
  patience: '#4caf50',
  patienceLow: '#e0392c',
  plate: '#f4f1e6',
  wok: '#3c3c46',
  grill: '#4a3a30',
};
