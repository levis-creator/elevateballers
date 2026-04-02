/**
 * Timer Web Worker — timestamp-based countdown clock.
 *
 * Uses Date.now() on each tick so the display stays accurate even when the
 * main thread is busy or the tab is hidden.  Running at 200 ms intervals
 * means the displayed second changes within 200 ms of the real second
 * boundary, which is imperceptible during a basketball game.
 *
 * Protocol
 * --------
 * Main → Worker messages:
 *   { type: 'START', remainingSeconds: number }
 *     Begin (or restart) the countdown with the given seconds remaining.
 *
 *   { type: 'STOP' }
 *     Pause the countdown and clear the interval.  The current remaining
 *     time is NOT automatically reported back — call getState() or listen
 *     for the next TICK if you need it.
 *
 * Worker → Main messages:
 *   { type: 'TICK', remainingSeconds: number }
 *     Emitted every ~200 ms while running, and once immediately on START.
 *
 *   { type: 'EXPIRED' }
 *     Emitted once when the countdown reaches 0.  The interval is cleared.
 */

'use strict';

let endTime = null;   // epoch ms when the countdown expires
let intervalId = null;

function tick() {
  if (endTime === null) return;

  const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  self.postMessage({ type: 'TICK', remainingSeconds: remaining });

  if (remaining <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    endTime = null;
    self.postMessage({ type: 'EXPIRED' });
  }
}

self.onmessage = function (e) {
  const { type, remainingSeconds } = e.data;

  if (type === 'START') {
    // Clear any existing interval before starting a new one
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    // Store the absolute end time
    endTime = Date.now() + remainingSeconds * 1000;

    // Fire an immediate tick so the UI updates without waiting 200 ms
    tick();

    // Poll at 200 ms — much finer than 1 second so we never miss a boundary
    intervalId = setInterval(tick, 200);

  } else if (type === 'STOP') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    endTime = null;
  }
};
