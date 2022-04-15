import * as THREE from 'three';
import { Sound } from './audio.js';
import { RenderObject } from './render_object.js';
import { renderer } from './renderer.js';
export class RenderExplosion extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._material = new THREE.MeshStandardMaterial({ color: 0xbb4444 });
        this._exploded = false;
    }
    initialize() {
        super.initialize();
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(this.dim().x / 2, 12, 8), this._material);
        this.setMesh(mesh);
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        mesh.receiveShadow = true;
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!this.hasMesh()) {
            return;
        }
        if (this._exploded) {
            return;
        }
        renderer.playSound(Sound.EXPLOSION, this.pos());
        this._exploded = true;
    }
}
