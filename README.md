# Kinetic — Movement Lab

A small third-person Three.js prototype. The humanoid, arena, textures, and animations are generated in code. No character files, downloaded models, or external assets are used.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Requires a desktop browser with WebGL 2.

WASD moves relative to the camera, Shift runs, Space jumps. Drag the mouse across the arena to orbit; scroll to zoom. R or **Reset position** returns to the starting point.

```sh
npm test
npm run build
npm run preview
```

For browser acceptance checks, start the dev server and run `npm run test:browser`. The test uses installed Microsoft Edge on Windows by default. Set `BROWSER_PATH` to another Chromium executable, or install Playwright Chromium with `npx playwright install chromium` on other systems.

## Architecture

- `core/Game.js`: lighting, render loop, fixed 120 Hz physics steps, HUD, lifecycle.
- `core/InputManager.js`: keyboard, mouse orbit, zoom, focus cleanup.
- `player/PlayerController.js`: acceleration, deceleration, facing, gravity and jumping; has no knowledge of meshes or animation.
- `player/Player.js`: connects the physics root to a replaceable visual and animator.
- `player/ProceduralCharacter.js`: jointed groups with capsule, box, sphere and cylinder meshes. Local +Z faces forward and local y=0 is the feet.
- `player/ProceduralAnimator.js`: smoothly blended idle, walk, run and airborne poses driven by motion state.
- `camera/ThirdPersonCamera.js`: damped follow, orbit, zoom and obstacle avoidance.
- `systems/CollisionSystem.js`: upright cylinder collision with boxes, round pillars, ramps and arena boundaries; platform support and grounding.
- `world/World.js`: test arena made from geometry, including walkable ramps, blocks, pillars and raised platforms.
- `config/gameConfig.js`: movement, camera and arena tuning.

To replace the visual later, use `player.setVisual(visual, animator)`. The visual exposes `object` (a THREE.Object3D) and optional `dispose()`. The animator exposes `update(deltaTime, state)`, where state includes speed, running, grounded and verticalSpeed. A future AnimationMixer adapter can consume the same state without changing movement, input, camera, collisions or the loop.

The collision implementation is deliberately small: axis-aligned static geometry, upright character cylinder, and analytic ramps. It is not a general rigid-body physics engine. The layout adapts to narrow screens, but gameplay currently requires a keyboard and mouse.

Next small step: add a short jump buffer and coyote time to make jumping at platform edges more forgiving.

API references: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) and [CapsuleGeometry](https://threejs.org/docs/pages/CapsuleGeometry.html).
