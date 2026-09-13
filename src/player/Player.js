import { Group } from 'three';
import { PlayerController } from './PlayerController.js';
import { ProceduralCharacter } from './ProceduralCharacter.js';
import { ProceduralAnimator } from './ProceduralAnimator.js';

export class Player {
  constructor(collision, visual = new ProceduralCharacter(), animator = new ProceduralAnimator(visual)) {
    this.object = new Group(); this.object.name = 'Player';
    this.controller = new PlayerController(collision);
    this.setVisual(visual, animator);
    this.sync();
  }
  // A future model adapter only needs { object, dispose() } and an animator with update(dt, state).
  setVisual(visual, animator) {
    if (this.visual) { this.object.remove(this.visual.object); this.visual.dispose?.(); }
    this.visual = visual; this.animator = animator; this.object.add(visual.object);
  }
  sync() { this.object.position.copy(this.controller.position); this.object.rotation.y = this.controller.yaw; }
  animate(dt) { this.sync(); this.animator.update(dt, this.controller.state); }
  dispose() { this.visual.dispose?.(); }
}
