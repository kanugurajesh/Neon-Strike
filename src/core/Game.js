import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { Player } from '../player/Player.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';
import { World } from '../world/World.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#e2e7d9'); this.scene.fog = new THREE.Fog('#e2e7d9', 28, 85);
    this.scene.add(new THREE.HemisphereLight('#fff7e6', '#7b8f76', 2.7));
    const sun = new THREE.DirectionalLight('#fff4dc', 3.2); sun.position.set(-12, 20, 9); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 0.5, far: 65 }); sun.shadow.normalBias = 0.025; sun.shadow.bias = -0.0002; sun.shadow.radius = 3; this.scene.add(sun);
    this.collision = new CollisionSystem(); this.world = new World(this.scene, this.collision);
    this.player = new Player(this.collision); this.scene.add(this.player.object);
    this.input = new InputManager(canvas); this.camera = new ThirdPersonCamera(this.player.controller.position, this.world.obstacles);
    this.lastTime = null; this.accumulator = 0; this.hudTime = 0; this.frames = 0; this.pendingJump = false;
    this.hud = Object.fromEntries(['speed', 'state', 'grounded', 'fps', 'compass-needle'].map((id) => [id, document.getElementById(id)]));
    this.resetHandler = () => { this.reset(); canvas.focus({ preventScroll: true }); };
    document.getElementById('reset').addEventListener('click', this.resetHandler);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement); this.resize();
    this.visibilityHandler = () => { this.lastTime = null; this.accumulator = 0; this.pendingJump = false; };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }
  resize() { const { width, height } = this.canvas.parentElement.getBoundingClientRect(); this.renderer.setSize(width, height, false); this.camera.resize(width, height); }
  reset() { this.player.controller.reset(); this.input.clear(); this.pendingJump = false; this.player.sync(); this.camera.reset(this.player.controller.position); this.updateHud(); }
  frame(time) {
    const dt = this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, 0.1); this.lastTime = time;
    if (this.input.consumeReset()) this.reset();
    this.camera.orbit(this.input.consumeOrbit()); this.pendingJump ||= this.input.consumeJump();
    this.accumulator += dt;
    // Fixed physics substeps retain delta-time behavior and prevent tunneling on slow frames.
    const step = 1 / 120;
    while (this.accumulator >= step) {
      this.player.controller.update(step, this.input, this.camera.yaw, this.pendingJump); this.pendingJump = false; this.accumulator -= step;
    }
    this.player.animate(dt); this.camera.update(dt, this.player.controller.position);
    this.renderer.render(this.scene, this.camera.camera);
    this.frames++; this.hudTime += dt;
    if (this.hudTime > 0.2) { this.updateHud(); this.hud.fps.textContent = Math.round(this.frames / this.hudTime); this.frames = 0; this.hudTime = 0; }
  }
  updateHud() {
    const state = this.player.controller.state;
    this.hud.speed.textContent = state.speed.toFixed(1); this.hud.state.textContent = state.name;
    this.hud.state.dataset.state = state.name.toLowerCase(); this.hud.grounded.textContent = state.grounded ? 'Yes ↧' : 'No ↑';
    this.hud['compass-needle'].style.transform = `rotate(${-this.camera.yaw}rad)`;
  }
  dispose() {
    this.renderer.setAnimationLoop(null); this.input.dispose(); this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.visibilityHandler); document.getElementById('reset').removeEventListener('click', this.resetHandler);
    this.scene.traverse((object) => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose()); else object.material?.dispose(); });
    this.world.textures.forEach((texture) => texture.dispose()); this.renderer.dispose();
  }
}
