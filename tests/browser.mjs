import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || (process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : undefined),
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  await page.goto(process.env.TEST_URL || 'http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__game?.renderer.info.render.calls > 0);
  await page.waitForTimeout(800);
  const read = () => page.evaluate(() => {
    const game = window.__game, c = game.player.controller, j = game.player.visual.joints;
    return { position: c.position.toArray(), speed: c.state.speed, grounded: c.grounded, yaw: c.yaw, cameraYaw: game.camera.yaw, camera: game.camera.camera.position.toArray(), state: c.state.name, leg: j.leftLeg.rotation.x, arm: j.leftArm.rotation.x, lean: j.body.rotation.x, breath: j.torso.scale.y };
  });
  const initial = await read(); assert.equal(initial.grounded, true); assert.equal(initial.state, 'Idle');
  await page.waitForTimeout(200); assert.notEqual((await read()).breath, initial.breath);
  await page.screenshot({ path: 'test-results/desktop.png' });
  await page.keyboard.down('w'); await page.waitForTimeout(750); const walk = await read();
  assert.ok(walk.position[2] < initial.position[2] - 1); assert.ok(walk.speed > 3.4); assert.notEqual(walk.leg, 0); assert.ok(walk.leg * walk.arm < 0);
  await page.keyboard.down('Shift'); await page.waitForTimeout(550); const run = await read();
  assert.ok(run.speed > 6.7); assert.ok(run.lean > 0.09);
  await page.keyboard.up('w'); await page.keyboard.up('Shift'); await page.waitForTimeout(500); assert.ok((await read()).speed < 0.1);
  await page.keyboard.press('Space'); await page.waitForTimeout(180); const jump = await read();
  assert.ok(jump.position[1] > 0.5); assert.equal(jump.grounded, false);
  await page.screenshot({ path: 'test-results/jump.png' });
  await page.waitForTimeout(1000); assert.equal((await read()).grounded, true); assert.equal((await read()).position[1], 0);
  await page.locator('#reset').click(); await page.waitForTimeout(200);
  const canvas = await page.locator('#game').boundingBox();
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.mouse.down(); await page.mouse.move(canvas.x + canvas.width / 2 + 260, canvas.y + canvas.height / 2 - 20, { steps: 12 }); await page.mouse.up();
  const orbited = await read(); assert.ok(Math.abs(orbited.cameraYaw - initial.cameraYaw) > 1);
  await page.keyboard.down('w'); await page.waitForTimeout(650); await page.keyboard.up('w'); const moved = await read();
  const dx = moved.position[0] - orbited.position[0], dz = moved.position[2] - orbited.position[2];
  assert.ok(dx * -Math.sin(orbited.cameraYaw) + dz * -Math.cos(orbited.cameraYaw) > 1);
  assert.ok(Math.hypot(moved.camera[0] - orbited.camera[0], moved.camera[2] - orbited.camera[2]) > 0.5);
  await page.keyboard.press('r'); await page.waitForTimeout(250); assert.deepEqual((await read()).position, initial.position);
  // Traverse a real arena ramp using normal keyboard movement.
  await page.evaluate(() => { const g = window.__game; g.player.controller.position.set(4.5, 0, -12.5); g.camera.yaw = Math.PI; });
  await page.keyboard.down('w'); await page.waitForTimeout(1650); await page.keyboard.up('w');
  const ramp = await read(); assert.ok(ramp.position[1] > 1.4); assert.equal(ramp.grounded, true);
  await page.locator('#reset').click();
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  console.log('Browser acceptance passed: rendered primitives, idle/walk/run/jump, gravity, orbit-relative movement, smooth camera follow, reset, ramp traversal, responsive layout; no console errors or failed requests.');
} finally { await browser.close(); }
