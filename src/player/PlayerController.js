import { Vector3 } from 'three';
import { gameConfig } from '../config/gameConfig.js';

export class PlayerController {
  constructor(collision) {
    this.collision = collision;
    this.position = new Vector3(...gameConfig.player.spawn);
    this.velocity = new Vector3();
    this.yaw = Math.PI; this.grounded = true; this.running = false;
    this.direction = new Vector3();
  }
  reset() { this.position.set(...gameConfig.player.spawn); this.velocity.set(0, 0, 0); this.yaw = Math.PI; this.grounded = true; this.running = false; }
  update(dt, input, cameraYaw, jump) {
    const config = gameConfig.player;
    const movement = input.movement;
    this.running = input.running;
    // Camera faces away from its orbit position. Diagonals are normalized.
    this.direction.set(movement.x * Math.cos(cameraYaw) - movement.z * Math.sin(cameraYaw), 0, -movement.x * Math.sin(cameraYaw) - movement.z * Math.cos(cameraYaw));
    const moving = this.direction.lengthSq() > 0;
    if (moving) this.direction.normalize();
    const targetSpeed = this.running ? config.runSpeed : config.walkSpeed;
    const acceleration = this.grounded ? (moving ? config.acceleration : config.deceleration) : config.airAcceleration;
    const targetX = this.direction.x * targetSpeed, targetZ = this.direction.z * targetSpeed;
    const dx = targetX - this.velocity.x, dz = targetZ - this.velocity.z;
    const change = Math.hypot(dx, dz), amount = Math.min(1, acceleration * dt / (change || 1));
    this.velocity.x += dx * amount; this.velocity.z += dz * amount;
    if (moving) {
      const targetYaw = Math.atan2(this.direction.x, this.direction.z);
      const difference = Math.atan2(Math.sin(targetYaw - this.yaw), Math.cos(targetYaw - this.yaw));
      this.yaw += difference * (1 - Math.exp(-config.turnSpeed * dt));
    }
    if (jump && this.grounded) { this.velocity.y = config.jumpSpeed; this.grounded = false; }
    this.velocity.y -= config.gravity * dt;
    this.collision.moveHorizontal(this.position, this.velocity, dt, this.grounded);
    this.grounded = this.collision.moveVertical(this.position, this.velocity, dt, this.grounded);
    if (this.position.y < -10) this.reset();
  }
  get state() {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    return { speed, grounded: this.grounded, running: this.running, verticalSpeed: this.velocity.y, name: !this.grounded ? (this.velocity.y > 0 ? 'Jump' : 'Falling') : speed < 0.1 ? 'Idle' : this.running && speed > 3.6 ? 'Run' : 'Walk' };
  }
}
