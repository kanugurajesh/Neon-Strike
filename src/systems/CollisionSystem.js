import { gameConfig } from '../config/gameConfig.js';

// Upright cylinder against boxes, round pillars and analytic ramp surfaces.
export class CollisionSystem {
  constructor() { this.colliders = []; }
  add(collider) { this.colliders.push(collider); }
  surface(c, x, z) {
    if (c.type === 'ramp') return c.height * Math.max(0, Math.min(1, (z - (c.z - c.depth / 2)) / c.depth));
    return c.height;
  }
  contains(c, x, z, margin = 0) {
    if (c.type === 'pillar') return Math.hypot(x - c.x, z - c.z) <= c.radius + margin;
    return Math.abs(x - c.x) <= c.width / 2 + margin && Math.abs(z - c.z) <= c.depth / 2 + margin;
  }
  moveHorizontal(position, velocity, dt, grounded) {
    const { radius, height, stepHeight } = gameConfig.player;
    for (const axis of ['x', 'z']) {
      position[axis] += velocity[axis] * dt;
      for (const c of this.colliders) {
        if (!this.contains(c, position.x, position.z, radius)) continue;
        const top = this.surface(c, position.x, position.z);
        // Small steps and continuous ramp climbing; airborne characters cannot step up walls.
        const allowance = grounded ? stepHeight : 0.005;
        if (position.y >= top - allowance || position.y + height <= (c.bottom ?? 0)) continue;
        if (c.type === 'pillar') {
          const dx = position.x - c.x, dz = position.z - c.z;
          const distance = Math.hypot(dx, dz);
          const overlap = c.radius + radius - distance;
          if (overlap > 0) { position.x += (distance ? dx / distance : 1) * overlap; position.z += (distance ? dz / distance : 0) * overlap; velocity[axis] = 0; }
        } else {
          const half = (axis === 'x' ? c.width : c.depth) / 2;
          position[axis] = c[axis] + (position[axis] < c[axis] ? -1 : 1) * (half + radius);
          velocity[axis] = 0;
        }
      }
      const limit = gameConfig.world.halfSize - radius;
      if (Math.abs(position[axis]) > limit) { position[axis] = Math.max(-limit, Math.min(limit, position[axis])); velocity[axis] = 0; }
    }
  }
  moveVertical(position, velocity, dt, wasGrounded) {
    const previousY = position.y;
    position.y += velocity.y * dt;
    let floor = 0;
    for (const c of this.colliders) {
      if (!this.contains(c, position.x, position.z)) continue;
      const top = this.surface(c, position.x, position.z);
      const allowance = wasGrounded ? gameConfig.player.stepHeight : 0.005;
      if (top <= previousY + allowance) floor = Math.max(floor, top);
      // Stop upward motion underneath a raised solid platform.
      const bottom = c.bottom ?? 0;
      if (velocity.y > 0 && previousY + gameConfig.player.height <= bottom && position.y + gameConfig.player.height >= bottom) {
        position.y = bottom - gameConfig.player.height; velocity.y = 0;
      }
    }
    const snap = wasGrounded && velocity.y <= 0 ? gameConfig.player.stepHeight : 0;
    if (velocity.y <= 0 && position.y <= floor + snap) { position.y = floor; velocity.y = 0; return true; }
    return false;
  }
}
