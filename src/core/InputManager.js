export class InputManager {
  constructor(canvas) {
    this.keys = new Set();
    this.jumpQueued = false;
    this.resetQueued = false;
    this.orbit = { x: 0, y: 0, zoom: 0 };
    this.dragging = false;
    this.abort = new AbortController();
    const listen = (target, event, callback, options = {}) => target.addEventListener(event, callback, { ...options, signal: this.abort.signal });
    listen(window, 'keydown', (event) => {
      if (event.target.closest('button, input, textarea, select')) return;
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyR'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.jumpQueued = true;
      if (event.code === 'KeyR' && !event.repeat) this.resetQueued = true;
    });
    listen(window, 'keyup', (event) => this.keys.delete(event.code));
    listen(window, 'blur', () => this.clear());
    listen(document, 'visibilitychange', () => { if (document.hidden) this.clear(); });
    listen(canvas, 'pointerdown', (event) => { this.dragging = true; canvas.focus(); canvas.setPointerCapture(event.pointerId); });
    listen(canvas, 'pointermove', (event) => { if (this.dragging) { this.orbit.x += event.movementX; this.orbit.y += event.movementY; } });
    listen(canvas, 'pointerup', () => { this.dragging = false; });
    listen(canvas, 'lostpointercapture', () => { this.dragging = false; });
    listen(canvas, 'wheel', (event) => { event.preventDefault(); this.orbit.zoom += event.deltaY * 0.01; }, { passive: false });
    listen(canvas, 'contextmenu', (event) => event.preventDefault());
  }
  get movement() { return { x: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')), z: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')) }; }
  get running() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  consumeJump() { const jump = this.jumpQueued; this.jumpQueued = false; return jump; }
  consumeReset() { const reset = this.resetQueued; this.resetQueued = false; return reset; }
  consumeOrbit() { const orbit = { ...this.orbit }; this.orbit.x = this.orbit.y = this.orbit.zoom = 0; return orbit; }
  clear() { this.keys.clear(); this.jumpQueued = false; this.resetQueued = false; this.dragging = false; }
  dispose() { this.abort.abort(); }
}
