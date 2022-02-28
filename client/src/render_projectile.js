import * as THREE from 'three';
import { RenderObject } from './render_object.js';
import { renderer } from './renderer.js';
export class RenderProjectile extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._lastSmoke = 0;
    }
    setMesh(mesh) {
        mesh.rotation.y = Math.PI / 2;
        super.setMesh(mesh);
    }
    update(msg) {
        super.update(msg);
        if (!this.hasMesh()) {
            return;
        }
        const vel = this.vel();
        const projectile = this._mesh.getObjectByName("mesh");
        const angle = vel.angle() * -1;
        projectile.rotation.x = angle;
        projectile.rotateZ(.12);
        if (Date.now() - this._lastSmoke >= 20) {
            const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.5 }));
            smoke.position.copy(this._mesh.position);
            renderer.sceneMap().scene().add(smoke);
            setTimeout(() => {
                renderer.sceneMap().scene().remove(smoke);
            }, 300);
            this._lastSmoke = Date.now();
        }
    }
}
