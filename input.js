// Dapur Kilat: mouse and keyboard input, translated into logical canvas points
// and key presses the game loop reads once a frame.

import { FIELD, LAYOUT } from './config.js';

export const KEY_CONFIRM = 'Space';
export const KEY_RESTART = 'KeyR';
export const KEY_PAUSE = 'KeyP';
export const KEY_MUTE = 'KeyM';

/** A rectangle hit test, in logical canvas coordinates. */
export function hitRect(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

/** The ticket rectangle for the order at this board position. */
export function ticketRect(index) {
  return {
    x: LAYOUT.board.x + index * (LAYOUT.ticket.w + LAYOUT.ticket.gap),
    y: LAYOUT.board.y + 8,
    w: LAYOUT.ticket.w,
    h: LAYOUT.ticket.h,
  };
}

const STATION_ORDER = ['chop', 'wok', 'grill', 'plate'];

/** The rectangle of a named station (chop, wok, grill, plate). */
export function stationRect(name) {
  const index = STATION_ORDER.indexOf(name);
  return {
    x: LAYOUT.stations.x + index * (LAYOUT.station.w + LAYOUT.station.gap),
    y: LAYOUT.stations.y,
    w: LAYOUT.station.w,
    h: LAYOUT.station.h,
  };
}

/** The rectangle of a counter bin by its index. */
export function binRect(index) {
  return {
    x: LAYOUT.counter.x + index * (LAYOUT.bin.w + LAYOUT.bin.gap),
    y: LAYOUT.counter.y + 20,
    w: LAYOUT.bin.w,
    h: LAYOUT.bin.h,
  };
}

/** The big centred button used on the title, complete and over screens. */
export function buttonRect() {
  return { x: FIELD.width / 2 - 180, y: 560, w: 360, h: 72 };
}

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * FIELD.width,
    y: ((clientY - rect.top) / rect.height) * FIELD.height,
  };
}

/**
 * Attach listeners to the canvas and the window. takeClicks and takeKeys drain
 * what happened since the last frame; the mouse position is always current.
 */
export function createInput(canvas) {
  const clicks = [];
  const keys = [];
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2, inside: false };

  function onMouseMove(event) {
    const point = toLogical(canvas, event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.inside = true;
  }

  function onMouseDown(event) {
    const point = toLogical(canvas, event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    clicks.push(point);
  }

  function onKeyDown(event) {
    if (event.code === KEY_CONFIRM) event.preventDefault();
    if (!event.repeat) keys.push(event.code);
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);

  return {
    mouse,
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeKeys() {
      return keys.splice(0, keys.length);
    },
  };
}
