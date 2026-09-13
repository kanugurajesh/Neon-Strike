import * as THREE from 'three';

export class World {
  constructor(scene, collision) {
    this.scene = scene; this.collision = collision; this.obstacles = []; this.textures = [];
    this.materials = {};
    for (const [name, color] of Object.entries({ floor: '#dce1d2', green: '#a5b992', lavender: '#b5add0', dark: '#526657', cream: '#eeeadc', orange: '#e7a77f' })) {
      this.materials[name] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });
    }
    const floor = new THREE.Mesh(new THREE.BoxGeometry(44, 0.4, 44), this.materials.floor);
    floor.position.y = -0.21; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(44, 44, '#b3bda8', '#c4ccb9'); grid.position.y = 0.006; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.materials.floor); outer.rotation.x = -Math.PI / 2; outer.position.y = -0.42; outer.receiveShadow = true; scene.add(outer);
    this.box(-5, -3, 2.4, 1.2, 2.4, 'lavender');
    this.box(-7.8, -5.6, 1.7, 2, 1.7, 'lavender');
    this.box(-5.2, -7.7, 1.7, 2.8, 1.7, 'lavender');
    this.box(4.5, -6, 5, 1.5, 4, 'green');
    this.ramp(4.5, -10, 3.2, 4, 1.5);
    this.box(9, -3.5, 2.3, 0.55, 2.3, 'green');
    this.box(10, -7, 2.3, 1, 2.3, 'green');
    this.ramp(-7, 6, 3.3, 4, 1.25);
    this.box(-7, 9, 3.3, 1.25, 2, 'green');
    for (const [x, z, height, radius] of [[-1, -8, 2.7, 0.65], [1, -12, 3.5, 0.7], [-2.8, -12, 1.8, 0.65], [8, 5, 2.6, 0.65], [11, 7, 3.6, 0.75]]) this.pillar(x, z, height, radius);
    this.box(4, 10, 2, 0.5, 2, 'lavender'); this.box(7, 12, 2, 1, 2, 'lavender');
    // Thin perimeter rail marks the collision boundary without enclosing the view.
    for (const z of [-22, 22]) this.decoration(new THREE.BoxGeometry(44, 0.1, 0.1), 'dark', [0, 0.04, z]);
    for (const x of [-22, 22]) this.decoration(new THREE.BoxGeometry(0.1, 0.1, 44), 'dark', [x, 0.04, 0]);
    for (let i = -20; i <= 20; i += 4) {
      this.decoration(new THREE.BoxGeometry(0.06, 0.015, 0.4), 'dark', [i, 0.014, -21.6]);
      this.decoration(new THREE.BoxGeometry(0.4, 0.015, 0.06), 'dark', [-21.6, 0.014, i]);
    }
    this.floorLabel('01  /  FREE MOVEMENT', 0, 8.4, 5.2);
    this.floorLabel('02  /  ELEVATION', 5, -12.9, 4.4);
    this.floorLabel('03  /  OBSTACLES', -6, -10.5, 4.3);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.09, 64), this.materials.dark); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.018, 5); scene.add(ring);
    for (const x of [-1.4, 1.4]) { this.decoration(new THREE.BoxGeometry(0.28, 0.02, 0.05), 'dark', [x, 0.018, 5]); this.decoration(new THREE.BoxGeometry(0.05, 0.02, 0.28), 'dark', [x, 0.018, 5]); }
  }
  decoration(geometry, material, position) {
    const mesh = new THREE.Mesh(geometry, this.materials[material]); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); return mesh;
  }
  box(x, z, width, height, depth, material) {
    const mesh = this.decoration(new THREE.BoxGeometry(width, height, depth), material, [x, height / 2, z]);
    this.obstacles.push(mesh); this.collision.add({ type: 'box', x, z, width, depth, height });
    // Fine contrasting top edge gives the simple geometry an architectural feel.
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: '#61705d', transparent: true, opacity: 0.22 })); mesh.add(edges);
  }
  pillar(x, z, height, radius) {
    const mesh = this.decoration(new THREE.CylinderGeometry(radius, radius, height, 12), 'cream', [x, height / 2, z]); this.obstacles.push(mesh);
    this.decoration(new THREE.CylinderGeometry(radius + 0.015, radius + 0.015, 0.12, 12), 'orange', [x, height - 0.15, z]);
    this.collision.add({ type: 'pillar', x, z, radius, height });
  }
  ramp(x, z, width, depth, height) {
    const w = width / 2, d = depth / 2;
    const vertices = [-w,0,-d, w,0,-d, -w,height,d, w,height,d, -w,0,d, w,0,d];
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex([0,2,1, 1,2,3, 0,4,2, 1,3,5, 4,5,3, 4,3,2, 0,1,5, 0,5,4]); geometry.computeVertexNormals();
    const mesh = this.decoration(geometry, 'green', [x, 0, z]); this.obstacles.push(mesh);
    this.collision.add({ type: 'ramp', x, z, width, depth, height });
  }
  floorLabel(text, x, z, width) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
    const context = canvas.getContext('2d'); context.fillStyle = '#65745e'; context.font = '500 37px monospace'; context.textAlign = 'center'; context.fillText(text, 512, 76);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; this.textures.push(texture);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    label.rotation.x = -Math.PI / 2; label.position.set(x, 0.024, z); this.scene.add(label);
  }
}
