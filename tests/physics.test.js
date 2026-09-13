import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionSystem } from '../src/systems/CollisionSystem.js';
import { PlayerController } from '../src/player/PlayerController.js';
import { ProceduralCharacter } from '../src/player/ProceduralCharacter.js';
import { ProceduralAnimator } from '../src/player/ProceduralAnimator.js';
import { Player } from '../src/player/Player.js';
import { Group } from 'three';

const idle = { movement: { x: 0, z: 0 }, running: false };
const forward = { movement: { x: 0, z: 1 }, running: false };
const advance = (player, seconds, input = idle, yaw = 0) => { for (let i = 0; i < seconds * 120; i++) player.update(1 / 120, input, yaw, false); };

test('idle remains grounded; acceleration, run, and deceleration work', () => {
  const player = new PlayerController(new CollisionSystem());
  advance(player, 2); assert.equal(player.position.y, 0); assert.equal(player.grounded, true);
  advance(player, 0.05, forward); assert.ok(player.state.speed > 0 && player.state.speed < 3.5);
  advance(player, 1, forward); assert.ok(Math.abs(player.state.speed - 3.5) < 0.001);
  advance(player, 0.5, { ...forward, running: true }); assert.ok(Math.abs(player.state.speed - 6.8) < 0.001);
  advance(player, 0.5); assert.equal(player.state.speed, 0);
});
test('movement and facing are camera relative and diagonals are normalized', () => {
  const a = new PlayerController(new CollisionSystem()); const b = new PlayerController(new CollisionSystem());
  advance(a, 1, forward, Math.PI / 2); assert.ok(a.position.x < -3); assert.ok(Math.abs(a.position.z - 5) < 0.001);
  assert.ok(Math.abs(Math.sin(a.yaw) + 1) < 0.001);
  advance(b, 1, { movement: { x: 1, z: 1 }, running: false }); assert.ok(Math.abs(b.state.speed - a.state.speed) < 0.001);
});
test('jump applies gravity, rejects midair jumps and lands on the floor', () => {
  const player = new PlayerController(new CollisionSystem());
  player.update(1 / 120, idle, 0, true); assert.ok(player.position.y > 0); assert.equal(player.grounded, false);
  advance(player, 0.25); const velocity = player.velocity.y;
  player.update(1 / 120, idle, 0, true); assert.ok(player.velocity.y < velocity);
  advance(player, 1); assert.equal(player.position.y, 0); assert.equal(player.grounded, true);
});
test('boxes and pillars block movement', () => {
  for (const collider of [{ type: 'box', x: 0, z: 1, width: 2, depth: 2, height: 3 }, { type: 'pillar', x: 0, z: 1, radius: 1, height: 3 }]) {
    const collision = new CollisionSystem(); collision.add(collider); const player = new PlayerController(collision);
    advance(player, 2, { ...forward, running: true }); assert.ok(player.position.z >= 2.319); assert.equal(player.position.y, 0);
  }
});
test('ramps can be climbed and descended and platforms support landing', () => {
  const collision = new CollisionSystem(); collision.add({ type: 'ramp', x: 0, z: 0, width: 4, depth: 4, height: 1.5 });
  collision.add({ type: 'box', x: 0, z: 3, width: 4, depth: 2, height: 1.5 });
  const player = new PlayerController(collision); player.position.set(0, 0, -3);
  advance(player, 1.5, { movement: { x: 0, z: -1 }, running: false }); assert.ok(player.position.y > 1.35); assert.equal(player.grounded, true);
  advance(player, 1.7, forward); assert.ok(player.position.y < 0.01); assert.equal(player.grounded, true);
  player.position.set(0, 4, 3); player.velocity.set(0, 0, 0); player.grounded = false;
  advance(player, 1); assert.equal(player.position.y, 1.5); assert.equal(player.grounded, true);
  advance(player, 2, { movement: { x: 1, z: 0 }, running: false }); assert.equal(player.position.y, 0);
});
test('world boundary and different timesteps remain stable', () => {
  const a = new PlayerController(new CollisionSystem()), b = new PlayerController(new CollisionSystem());
  advance(a, 1, forward); for (let i = 0; i < 60; i++) b.update(1 / 60, forward, 0, false);
  assert.ok(Math.abs(a.position.z - b.position.z) < 0.04);
  advance(a, 20, forward); assert.ok(a.position.z >= -21.68);
});
test('primitive hierarchy animates independently of physics and supports visual replacement', () => {
  const visual = new ProceduralCharacter(); const animator = new ProceduralAnimator(visual);
  assert.ok(Object.keys(visual.joints).length >= 15);
  let meshes = 0; visual.object.traverse((object) => { if (object.isMesh) { meshes++; assert.ok(['BoxGeometry', 'CapsuleGeometry', 'SphereGeometry', 'CylinderGeometry'].includes(object.geometry.type)); } }); assert.ok(meshes >= 30);
  animator.update(0.1, { speed: 0, grounded: true, running: false }); const idleY = visual.joints.body.position.y;
  animator.update(0.1, { speed: 0, grounded: true, running: false }); assert.notEqual(visual.joints.body.position.y, idleY);
  for (let i = 0; i < 60; i++) animator.update(1 / 60, { speed: 3.5, grounded: true, running: false });
  assert.ok(visual.joints.leftLeg.rotation.x * visual.joints.rightLeg.rotation.x < 0);
  assert.ok(visual.joints.leftArm.rotation.x * visual.joints.leftLeg.rotation.x < 0);
  for (let i = 0; i < 60; i++) animator.update(1 / 60, { speed: 6.8, grounded: true, running: true });
  assert.ok(visual.joints.body.rotation.x > 0.1); assert.ok(visual.joints.leftForearm.rotation.x < -0.8);
  for (let i = 0; i < 30; i++) animator.update(1 / 60, { speed: 0, grounded: false, running: false }); assert.ok(visual.joints.leftShin.rotation.x > 0.5);
  assert.equal(visual.object.position.y, 0);
  const player = new Player(new CollisionSystem(), visual, animator); const controller = player.controller;
  player.setVisual({ object: new Group(), dispose() {} }, { update() {} }); player.animate(0.1); assert.equal(player.controller, controller);
});
