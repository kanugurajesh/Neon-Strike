import { PerspectiveCamera, Vector3, MathUtils, Raycaster } from 'three';
import { gameConfig } from '../config/gameConfig.js';

export class ThirdPersonCamera {
  constructor(position, obstacles) {
    this.config = gameConfig.camera;
    this.camera = new PerspectiveCamera(48, 1, 0.1, 150);
    this.yaw = this.config.yaw; this.pitch = this.config.pitch; this.distance = this.config.distance;
    this.target = position.clone().add(new Vector3(0, 1.05, 0));
    this.desired = new Vector3(); this.offset = new Vector3(); this.ray = new Raycaster(); this.obstacles = obstacles;
    this.update(1, position);
  }
  orbit(delta) {
    this.yaw -= delta.x * this.config.sensitivity;
    this.pitch = MathUtils.clamp(this.pitch + delta.y * this.config.sensitivity, 0.12, 1.15);
    this.distance = MathUtils.clamp(this.distance + delta.zoom, this.config.minDistance, this.config.maxDistance);
  }
  update(dt, position) {
    this.desired.copy(position); this.desired.y += 1.05;
    this.target.lerp(this.desired, 1 - Math.exp(-this.config.followSpeed * dt));
    this.offset.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    this.ray.set(this.target, this.offset); this.ray.far = this.distance;
    const hit = this.ray.intersectObjects(this.obstacles, false)[0];
    const distance = hit ? Math.max(0.5, hit.distance - 0.25) : this.distance;
    this.camera.position.copy(this.target).addScaledVector(this.offset, distance);
    this.camera.lookAt(this.target);
  }
  resize(width, height) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  reset(position) { this.yaw = this.config.yaw; this.pitch = this.config.pitch; this.distance = this.config.distance; this.target.copy(position).y += 1.05; this.update(1, position); }
}
