import { MathUtils } from 'three';

// Receives read-only motion data. Never moves the player's physics root.
export class ProceduralAnimator {
  constructor(character) { this.joints = character.joints; this.time = 0; this.phase = 0; this.activity = 0; this.run = 0; this.air = 0; }
  update(dt, state) {
    this.time += dt;
    this.activity = MathUtils.damp(this.activity, Math.min(state.speed / 3.5, 1), 9, dt);
    this.run = MathUtils.damp(this.run, state.running && state.speed > 3.6 ? 1 : 0, 8, dt);
    this.air = MathUtils.damp(this.air, state.grounded ? 0 : 1, 12, dt);
    this.phase += dt * (7 + this.run * 5) * Math.max(this.activity, 0.15);
    const j = this.joints, swing = Math.sin(this.phase), active = this.activity * (1 - this.air);
    const amplitude = 0.48 + this.run * 0.37;
    const set = (part, axis, target) => { j[part].rotation[axis] = MathUtils.damp(j[part].rotation[axis], target, 16, dt); };
    j.body.position.y = 1.02 + Math.sin(this.time * 2.2) * 0.012 * (1 - active) + Math.abs(Math.cos(this.phase)) * 0.045 * active;
    j.torso.scale.y = 1 + Math.sin(this.time * 2.2) * 0.012 * (1 - active);
    set('body', 'x', this.run * 0.13 * (1 - this.air) + this.air * 0.08);
    set('torso', 'y', swing * 0.075 * active);
    set('torso', 'z', Math.sin(this.phase) * 0.025 * active);
    set('head', 'y', Math.sin(this.time * 0.75) * 0.07 * (1 - active));
    for (const [side, sign] of [['left', 1], ['right', -1]]) {
      const wave = swing * sign;
      set(`${side}Leg`, 'x', wave * amplitude * active - this.air * (side === 'left' ? 0.45 : 0.18));
      set(`${side}Shin`, 'x', Math.max(0, -wave) * (0.65 + this.run * 0.55) * active + this.air * 0.65);
      set(`${side}Arm`, 'x', -wave * amplitude * 0.8 * active - this.air * 0.55);
      set(`${side}Arm`, 'z', sign * (0.08 + this.air * 0.25 + Math.sin(this.time * 1.7) * 0.025 * (1 - active)));
      set(`${side}Forearm`, 'x', -0.12 - this.run * 0.8 - this.air * 0.5);
      set(`${side}Foot`, 'x', -this.air * 0.15);
    }
  }
}
