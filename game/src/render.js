// Dapur Kilat: every pixel the player sees. All art is drawn in code (canvas
// paths), no images, no fonts from the network. The renderer only reads state;
// it never changes it.

import { COLORS, DISHES, FIELD, INGREDIENTS, LAYOUT, PROCESS, SCORE } from './config.js';
import { SCREEN_COMPLETE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, itemLabel } from './state.js';
import { binRect, buttonRect, stationRect, ticketRect } from './input.js';

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function shadowed(ctx, value, x, y, size, color, align = 'left') {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x + 2, y + 2);
  text(ctx, value, x, y, size, color, align);
}

/** A little steam wisp above hot food, drawn from a fixed phase so shots are stable. */
function steam(ctx, x, y, phase) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let index = 0; index < 2; index += 1) {
    const offset = index * 14 - 7;
    ctx.beginPath();
    ctx.moveTo(x + offset, y);
    ctx.quadraticCurveTo(x + offset + 5, y - 8, x + offset - 2 + phase * 2, y - 16);
    ctx.stroke();
  }
}

/** Draw one ingredient glyph at (x, y) inside a box of this size. */
export function drawIngredient(ctx, id, stage, x, y, size) {
  const half = size / 2;
  const cx = x + half;
  const cy = y + half;
  const burnt = stage === 'burnt';
  ctx.save();
  if (id === 'rice') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#f5f0dc';
    ctx.beginPath();
    ctx.arc(cx, cy + half * 0.25, half * 0.75, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#d9cba6';
    ctx.beginPath();
    ctx.ellipse(cx, cy + half * 0.25, half * 0.75, half * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'noodles') {
    ctx.strokeStyle = burnt ? '#2b2b2b' : '#f7d774';
    ctx.lineWidth = size * 0.09;
    ctx.lineCap = 'round';
    for (let row = 0; row < 3; row += 1) {
      const yy = cy - half * 0.4 + row * half * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - half * 0.6, yy);
      ctx.quadraticCurveTo(cx - half * 0.2, yy - 6, cx, yy);
      ctx.quadraticCurveTo(cx + half * 0.2, yy + 6, cx + half * 0.6, yy);
      ctx.stroke();
    }
  } else if (id === 'chicken') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#f2b28c';
    ctx.beginPath();
    ctx.arc(cx - half * 0.1, cy - half * 0.1, half * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = burnt ? '#1a1a1a' : '#fff6e0';
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + half * 0.3, cy + half * 0.3);
    ctx.lineTo(cx + half * 0.75, cy + half * 0.75);
    ctx.stroke();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#fff6e0';
    ctx.beginPath();
    ctx.arc(cx + half * 0.78, cy + half * 0.72, half * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, half * 0.8, half * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#f2b705';
    ctx.beginPath();
    ctx.arc(cx, cy, half * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'veg') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#5da24a';
    for (const [ox, oy, r] of [[-0.3, -0.2, 0.42], [0.3, -0.25, 0.38], [0, 0.3, 0.44]]) {
      ctx.beginPath();
      ctx.arc(cx + ox * half, cy + oy * half, r * half, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = burnt ? '#1a1a1a' : '#8ed081';
    ctx.beginPath();
    ctx.arc(cx - half * 0.15, cy - half * 0.1, half * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sauce') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#e05b4b';
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.35, cy + half * 0.6);
    ctx.quadraticCurveTo(cx - half * 0.5, cy - half * 0.1, cx, cy - half * 0.7);
    ctx.quadraticCurveTo(cx + half * 0.5, cy - half * 0.1, cx + half * 0.35, cy + half * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - half * 0.15, cy - half * 0.1, half * 0.1, half * 0.3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'skewer') {
    ctx.strokeStyle = '#a4713a';
    ctx.lineWidth = size * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.7, cy + half * 0.6);
    ctx.lineTo(cx + half * 0.7, cy - half * 0.6);
    ctx.stroke();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#d99a5b';
    for (const t of [0.25, 0.5, 0.75]) {
      const px = cx - half * 0.7 + t * half * 1.4;
      const py = cy + half * 0.6 - t * half * 1.2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-Math.PI / 4);
      rr(ctx, -half * 0.24, -half * 0.24, half * 0.48, half * 0.48, 4);
      ctx.fill();
      ctx.restore();
    }
  } else if (id === 'peanut') {
    ctx.fillStyle = burnt ? '#2b2b2b' : '#c98f4e';
    ctx.beginPath();
    ctx.ellipse(cx, cy, half * 0.55, half * 0.75, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#8a5a24';
    ctx.beginPath();
    ctx.ellipse(cx, cy, half * 0.2, half * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (stage === 'chopped') {
    ctx.strokeStyle = 'rgba(60,40,20,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.5, cy);
    ctx.lineTo(cx + half * 0.5, cy);
    ctx.moveTo(cx, cy - half * 0.5);
    ctx.lineTo(cx, cy + half * 0.5);
    ctx.stroke();
  }
  if (stage === 'cooked' || stage === 'grilled') steam(ctx, cx, cy - half * 0.7, 0);
  ctx.restore();
}

/** A progress ring around a station item, 0 to 1 done, gold when finished. */
function progressRing(ctx, x, y, radius, fraction, done, burnt) {
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = burnt ? '#e0392c' : done ? COLORS.gold : '#7ec850';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fraction));
  ctx.stroke();
}

function drawTicket(ctx, order, index, plate) {
  const rect = ticketRect(index);
  const dish = order.dish;
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  const low = patienceShare < 0.3;
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = low ? COLORS.patienceLow : COLORS.ticketEdge;
  ctx.lineWidth = low ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = dish.color;
  rr(ctx, rect.x, rect.y, rect.w, 34, 12);
  ctx.fill();
  ctx.fillRect(rect.x, rect.y + 22, rect.w, 12);
  text(ctx, `#${order.id} ${dish.name}`, rect.x + 12, rect.y + 18, 17, '#fff', 'left');
  text(ctx, `${dish.price} koin`, rect.x + rect.w - 12, rect.y + 18, 14, '#fff', 'right');
  dish.recipe.forEach((key, step) => {
    const [id, stage] = key.split(':');
    const sx = rect.x + 14 + step * 56;
    const sy = rect.y + 42;
    const done = plate.includes(key);
    ctx.globalAlpha = done ? 0.35 : 1;
    drawIngredient(ctx, id, stage === 'burnt' ? 'raw' : stage || 'raw', sx, sy, 40);
    ctx.globalAlpha = 1;
    if (done) {
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 22);
      ctx.lineTo(sx + 17, sy + 31);
      ctx.lineTo(sx + 33, sy + 9);
      ctx.stroke();
    }
  });
  text(ctx, dish.steps.join(' + '), rect.x + rect.w / 2, rect.y + 92, 10, COLORS.ink, 'center', 'normal');
  const barY = rect.y + rect.h - 14;
  ctx.fillStyle = '#e5d9b8';
  rr(ctx, rect.x + 12, barY, rect.w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = low ? COLORS.patienceLow : COLORS.patience;
  rr(ctx, rect.x + 12, barY, (rect.w - 24) * patienceShare, 8, 4);
  ctx.fill();
}

function drawStation(ctx, state, name, title, hint) {
  const rect = stationRect(name);
  const station = state.stations[name];
  const isPlate = name === 'plate';
  ctx.fillStyle = isPlate ? '#7a5c38' : COLORS.wood;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 16);
  ctx.fill();
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, title, rect.x + rect.w / 2, rect.y + 26, 22, COLORS.cream, 'center');
  text(ctx, hint, rect.x + rect.w / 2, rect.y + 50, 13, '#e8d9b0', 'center', 'normal');

  if (isPlate) {
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 150, 104, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = state.plateSelected ? COLORS.gold : '#c9b98f';
    ctx.lineWidth = state.plateSelected ? 6 : 3;
    ctx.stroke();
    ctx.fillStyle = '#d9cba6';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 150, 62, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    state.plate.forEach((key, index) => {
      const [id, stage] = key.split(':');
      const angle = (index / Math.max(1, state.plate.length)) * Math.PI * 2 - Math.PI / 2;
      const px = rect.x + rect.w / 2 + Math.cos(angle) * 48 - 20;
      const py = rect.y + 150 + Math.sin(angle) * 26 - 20;
      drawIngredient(ctx, id, stage || 'raw', px, py, 40);
    });
    if (state.plate.length === 0) text(ctx, 'Piring kosong', rect.x + rect.w / 2, rect.y + 150, 15, '#9a8a68', 'center', 'normal');
    else if (state.plateSelected) text(ctx, 'SIAP DIANTAR, klik tiket', rect.x + rect.w / 2, rect.y + 232, 14, COLORS.gold, 'center');
    else text(ctx, 'Klik piring untuk memilih', rect.x + rect.w / 2, rect.y + 232, 13, '#e8d9b0', 'center', 'normal');
    return;
  }

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 148;
  if (name === 'wok') {
    ctx.fillStyle = COLORS.wok;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 96, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#565664';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 96, 40, 0, 0, Math.PI);
    ctx.fill();
  } else if (name === 'grill') {
    ctx.fillStyle = COLORS.grill;
    rr(ctx, cx - 96, cy - 42, 192, 84, 10);
    ctx.fill();
    ctx.strokeStyle = '#6b5a4a';
    ctx.lineWidth = 4;
    for (let bar = 0; bar < 5; bar += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 88, cy - 30 + bar * 16);
      ctx.lineTo(cx + 88, cy - 30 + bar * 16);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#b98a4e';
    rr(ctx, cx - 100, cy - 44, 200, 88, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 88, cy);
    ctx.lineTo(cx + 88, cy);
    ctx.stroke();
  }

  if (station.item) {
    drawIngredient(ctx, station.item.id, station.burnt ? 'burnt' : station.item.stage, cx - 34, cy - 34, 68);
    if (!station.done) progressRing(ctx, cx, cy, 52, station.progress, false, false);
    else if (station.burnt) {
      text(ctx, 'GOSONG!', cx, cy - 64, 18, '#ff6b5e', 'center');
      text(ctx, 'klik untuk buang', cx, cy + 66, 13, '#ffb3ab', 'center', 'normal');
      progressRing(ctx, cx, cy, 52, 1, true, true);
    } else {
      progressRing(ctx, cx, cy, 52, 1, true, false);
      text(ctx, 'SELESAI, klik untuk ambil', cx, cy + 66, 13, COLORS.gold, 'center');
    }
  } else {
    text(ctx, 'Kosong', cx, cy, 15, '#d9c9a8', 'center', 'normal');
  }
}

function drawBin(ctx, index) {
  const ingredient = INGREDIENTS[index];
  const rect = binRect(index);
  ctx.fillStyle = '#5a3d22';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawIngredient(ctx, ingredient.id, 'raw', rect.x + rect.w / 2 - 30, rect.y + 12, 60);
  text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 96, 17, COLORS.cream, 'center');
  ctx.fillStyle = COLORS.brass;
  rr(ctx, rect.x + rect.w / 2 - 14, rect.y + 112, 28, 24, 6);
  ctx.fill();
  text(ctx, ingredient.key, rect.x + rect.w / 2, rect.y + 125, 15, COLORS.ink, 'center');
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  const hud = LAYOUT.hud;
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(hud.x, hud.y + hud.h - 4, hud.w, 4);
  shadowed(ctx, 'DAPUR KILAT', 20, 34, 30, COLORS.gold);
  text(ctx, `Shift ${state.shift}/3`, 300, 34, 18, COLORS.cream, 'left');
  const timerW = 260;
  const timerX = 430;
  ctx.fillStyle = '#241608';
  rr(ctx, timerX, 18, timerW, 28, 8);
  ctx.fill();
  const share = Math.max(0, state.shiftTimeLeft / 180);
  ctx.fillStyle = share < 0.2 ? COLORS.patienceLow : COLORS.gold;
  rr(ctx, timerX, 18, timerW * share, 28, 8);
  ctx.fill();
  text(ctx, formatTime(state.shiftTimeLeft), timerX + timerW / 2, 33, 18, '#fff', 'center');
  text(ctx, `Koin ${state.coins}`, 740, 34, 20, COLORS.gold, 'left');
  text(ctx, `Skor ${state.score}`, 880, 34, 20, COLORS.cream, 'left');
  text(ctx, state.combo > 1 ? `Combo x${state.combo}` : '', 1020, 34, 18, '#ff9d5c', 'left');
  const held = state.held ? itemLabel(state.held) : 'Tangan kosong';
  text(ctx, held, FIELD.width - 32, 34, 16, state.held ? '#aee6a0' : '#c9b896', 'right', 'normal');
}

function drawBoard(ctx, state) {
  const board = LAYOUT.board;
  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,246,224,0.25)';
    rr(ctx, board.x, board.y + 8, board.w, 112, 12);
    ctx.fill();
    text(ctx, 'Belum ada pesanan, tunggu sebentar...', board.x + board.w / 2, board.y + 64, 18, COLORS.cream, 'center', 'normal');
  }
  state.orders.forEach((order, index) => drawTicket(ctx, order, index, state.plate));
}

function drawCounter(ctx) {
  const counter = LAYOUT.counter;
  text(ctx, 'BAHAN DI MEJA (klik untuk ambil, tombol 1-8)', counter.x + 4, counter.y + 6, 15, COLORS.brass, 'left');
  INGREDIENTS.forEach((_, index) => drawBin(ctx, index));
}

function drawHeldAtCursor(ctx, state, mouse) {
  if (!state.held || !mouse.inside) return;
  ctx.globalAlpha = 0.95;
  drawIngredient(ctx, state.held.id, state.held.stage, mouse.x - 22, mouse.y - 44, 44);
  ctx.globalAlpha = 1;
  text(ctx, itemLabel(state.held), mouse.x, mouse.y - 52, 13, COLORS.cream, 'center');
}

function drawPops(ctx, state) {
  for (const pop of state.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life));
    shadowed(ctx, pop.text, pop.x, pop.y, 30, COLORS.gold, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawMessage(ctx, state) {
  if (state.messageTimer <= 0 || !state.message) return;
  const alpha = Math.min(1, state.messageTimer);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  const width = 520;
  rr(ctx, FIELD.width / 2 - width / 2, 728, width, 40, 10);
  ctx.fill();
  text(ctx, state.message, FIELD.width / 2, 749, 18, COLORS.cream, 'center');
  ctx.globalAlpha = 1;
}

function drawOverlay(ctx, title, lines, buttonLabel) {
  ctx.fillStyle = 'rgba(16,10,5,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = COLORS.wallTop;
  rr(ctx, FIELD.width / 2 - 360, 150, 720, 380, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  ctx.stroke();
  shadowed(ctx, title, FIELD.width / 2, 210, 44, COLORS.gold, 'center');
  lines.forEach((line, index) => {
    text(ctx, line, FIELD.width / 2, 280 + index * 34, 19, COLORS.cream, 'center', 'normal');
  });
  const button = buttonRect();
  ctx.fillStyle = COLORS.gold;
  rr(ctx, button.x, button.y, button.w, button.h, 12);
  ctx.fill();
  text(ctx, buttonLabel, button.x + button.w / 2, button.y + button.h / 2 + 1, 24, COLORS.ink, 'center');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 0, FIELD.width, 220);
  for (let row = 0; row < 5; row += 1) {
    ctx.fillStyle = row % 2 === 0 ? '#6b4420' : '#7a4f26';
    ctx.fillRect(0, 420 + row * 76, FIELD.width, 76);
  }
  drawIngredient(ctx, 'rice', 'raw', 180, 300, 120);
  drawIngredient(ctx, 'chicken', 'raw', 980, 300, 120);
  drawIngredient(ctx, 'skewer', 'grilled', 180, 560, 120);
  drawIngredient(ctx, 'veg', 'raw', 980, 560, 120);
  shadowed(ctx, 'DAPUR KILAT', FIELD.width / 2, 130, 84, COLORS.gold, 'center');
  text(ctx, 'Warung cepat saji: masak, sajikan, jangan sampai hangus!', FIELD.width / 2, 210, 22, COLORS.cream, 'center', 'normal');
  text(ctx, 'Klik bahan, olah di stasiun, susun di piring, klik tiket untuk antar.', FIELD.width / 2, 300, 19, '#e8d9b0', 'center', 'normal');
  text(ctx, 'Nasi Goreng, Mie Ayam, Sate Ayam, Gado-Gado. 3 shift, 3 menit tiap shift.', FIELD.width / 2, 334, 19, '#e8d9b0', 'center', 'normal');
  text(ctx, 'Tombol 1-8 pilih bahan, Spasi olah, R mulai ulang, P jeda, M suara.', FIELD.width / 2, 368, 19, '#e8d9b0', 'center', 'normal');
  if (state.best > 0) text(ctx, `Skor terbaik: ${state.best}`, FIELD.width / 2, 420, 20, COLORS.gold, 'center');
  const button = buttonRect();
  ctx.fillStyle = COLORS.gold;
  rr(ctx, button.x, button.y, button.w, button.h, 12);
  ctx.fill();
  text(ctx, 'MULAI MASAK', button.x + button.w / 2, button.y + button.h / 2 + 1, 26, COLORS.ink, 'center');
}

/** Paint the whole game for the current screen. The title screen paints its own
 *  backdrop; every other screen shares the kitchen layout below. */
export function drawGame(ctx, state, mouse) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state);
    return;
  }
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, LAYOUT.stations.y - 8, FIELD.width, LAYOUT.stations.h + 24);
  drawHud(ctx, state);
  drawBoard(ctx, state);
  drawStation(ctx, state, 'chop', 'TALENAN', 'klik: cincang');
  drawStation(ctx, state, 'wok', 'WAJAN', 'klik: masak');
  drawStation(ctx, state, 'grill', 'PANGGANGAN', 'klik: bakar');
  drawStation(ctx, state, 'plate', 'PIRING SAJI', 'klik: susun / pilih');
  drawCounter(ctx);
  drawPops(ctx, state);
  drawMessage(ctx, state);
  drawHeldAtCursor(ctx, state, mouse);

  if (state.screen === SCREEN_PAUSED) {
    drawOverlay(ctx, 'JEDA', ['Istirahat sebentar, kompor tetap menyala di kepala.', 'Tekan P atau klik untuk lanjut.'], 'LANJUTKAN');
  } else if (state.screen === SCREEN_COMPLETE) {
    const last = state.shift >= 3;
    drawOverlay(
      ctx,
      last ? 'SHIFT TERAKHIR SELESAI' : `SHIFT ${state.shift} SELESAI`,
      [
        `Pesanan terantar: ${state.served}  |  Pesanan hangus: ${state.lost}`,
        `Koin: ${state.coins}  |  Skor: ${state.score}  |  Combo terbaik: x${state.bestCombo}`,
        last ? 'Itu shift terakhir. Lihat skor akhirmu.' : 'Shift berikut lebih ramai dan lebih cepat.',
      ],
      last ? 'LIHAT SKOR AKHIR' : 'SHIFT BERIKUTNYA',
    );
  } else if (state.screen === SCREEN_OVER) {
    const won = state.lost < 5;
    drawOverlay(
      ctx,
      won ? 'DAPUR TUTUP, KERJA BAGUS!' : 'DAPUR KEWALAHAN',
      [
        `Skor akhir: ${state.score}  |  Koin: ${state.coins}`,
        `Pesanan terantar: ${state.served}  |  Pesanan hangus: ${state.lost}`,
        `Combo terbaik: x${state.bestCombo}  |  Skor terbaik: ${Math.max(state.best, state.score)}`,
        won ? 'Semua shift selesai tanpa bangkrut.' : 'Terlalu banyak pelanggan pergi.',
      ],
      'MAIN LAGI (R)',
    );
  }
  void SCREEN_PLAY;
  void DISHES;
  void SCORE;
}
