import * as THREE from 'three';
import { Sound } from './audio.js';
import { RenderProjectile } from './render_projectile.js';
export class RenderBolt extends RenderProjectile {
    constructor(space, id) {
        super(space, id);
        this._material = new THREE.MeshStandardMaterial({ color: 0xa3fa98 });
        this.setSound(Sound.PEW);
    }
    ready() {
        return super.ready() && this.hasOwner();
    }
    initialize() {
        super.initialize();
        const dim = this.dim();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 0.2), this._material);
        this.setMesh(mesh);
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!this.hasMesh()) {
            return;
        }
        this.mesh().rotation.z = this.vel().angle();
    }
}
