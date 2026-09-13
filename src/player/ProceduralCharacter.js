import * as THREE from 'three';

// Visual contract: object (Object3D), joints for its animator, and dispose(). Feet are at local y = 0; forward is +Z.
export class ProceduralCharacter {
  constructor() {
    this.object = new THREE.Group();
    this.object.name = 'ProceduralCharacter';
    this.joints = {};
    const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.76, flatShading: true });
    this.materials = { suit: material('#ef996b'), light: material('#ffd0a2'), dark: material('#384e43'), joint: material('#607164'), visor: material('#23382f'), eyes: material('#dcf7ae') };
    const mesh = (geometry, mat, parent, position = [0, 0, 0]) => {
      const part = new THREE.Mesh(geometry, this.materials[mat]);
      part.position.set(...position); part.castShadow = true; part.receiveShadow = true; parent.add(part); return part;
    };
    const group = (name, parent, position) => { const part = new THREE.Group(); part.name = name; part.position.set(...position); parent.add(part); this.joints[name] = part; return part; };
    const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const capsule = (r, h) => new THREE.CapsuleGeometry(r, h, 3, 8);
    const sphere = (r) => new THREE.SphereGeometry(r, 10, 6);
    const body = group('body', this.object, [0, 1.02, 0]);
    mesh(box(0.49, 0.25, 0.32), 'dark', body, [0, 0.04, 0]);
    const torso = group('torso', body, [0, 0.17, 0]);
    const chest = mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.59, 6), 'suit', torso, [0, 0.29, 0]); chest.scale.z = 0.64;
    mesh(box(0.24, 0.13, 0.026), 'light', torso, [0, 0.43, 0.202]);
    mesh(box(0.09, 0.07, 0.03), 'dark', torso, [0.18, 0.22, 0.18]);
    mesh(box(0.36, 0.36, 0.17), 'dark', torso, [0, 0.3, -0.23]);
    mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.13, 8), 'joint', torso, [0, 0.65, 0]);
    const head = group('head', torso, [0, 0.87, 0]);
    mesh(capsule(0.225, 0.14), 'suit', head);
    mesh(box(0.36, 0.145, 0.12), 'visor', head, [0, 0.015, 0.177]);
    for (const x of [-0.085, 0.085]) mesh(box(0.035, 0.05, 0.015), 'eyes', head, [x, 0.02, 0.243]);
    for (const [side, sign] of [['left', 1], ['right', -1]]) {
      const arm = group(`${side}Arm`, torso, [sign * 0.39, 0.51, 0]);
      mesh(sphere(0.15), 'suit', arm);
      mesh(capsule(0.105, 0.19), 'suit', arm, [0, -0.18, 0]);
      const forearm = group(`${side}Forearm`, arm, [0, -0.36, 0]);
      mesh(sphere(0.088), 'joint', forearm);
      mesh(capsule(0.087, 0.17), 'dark', forearm, [0, -0.13, 0]);
      const hand = group(`${side}Hand`, forearm, [0, -0.31, 0]);
      mesh(capsule(0.092, 0.035), 'light', hand);
      const leg = group(`${side}Leg`, body, [sign * 0.16, -0.025, 0]);
      mesh(sphere(0.13), 'joint', leg);
      mesh(capsule(0.125, 0.23), 'dark', leg, [0, -0.22, 0]);
      const shin = group(`${side}Shin`, leg, [0, -0.44, 0]);
      mesh(sphere(0.11), 'suit', shin);
      mesh(capsule(0.105, 0.24), 'joint', shin, [0, -0.2, 0]);
      const foot = group(`${side}Foot`, shin, [0, -0.42, 0.07]);
      mesh(box(0.25, 0.2, 0.4), 'dark', foot);
      mesh(box(0.25, 0.055, 0.4), 'light', foot, [0, -0.07, 0]);
    }
  }
  dispose() { this.object.traverse((part) => part.geometry?.dispose()); Object.values(this.materials).forEach((material) => material.dispose()); }
}
