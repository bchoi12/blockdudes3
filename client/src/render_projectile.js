import * as THREE from 'three';
import { particles } from './particles.js';
import { RenderObject } from './render_object.js';
import { RenderParticle } from './render_particle.js';
import { MathUtil } from './util.js';
export class RenderProjectile extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._smokeMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.5 });
        this._smokeInterval = 15;
        this._rotateZ = 0.12;
        this._positionZ = 0.5;
        this._lastSmoke = 0;
    }
    setMesh(mesh) {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.z = this._positionZ;
        super.setMesh(mesh);
    }
    update(msg) {
        super.update(msg);
        if (!this.hasMesh()) {
            return;
        }
        const pos = this.pos();
        const vel = this.vel();
        const angle = vel.angle() * -1;
        const projectile = this.mesh().getObjectByName("mesh");
        projectile.rotation.x = angle;
        projectile.rotateZ(this._rotateZ);
        if (Date.now() - this._lastSmoke >= this._smokeInterval) {
            const smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(MathUtil.randomRange(0.1, 0.2), 3, 3), this._smokeMaterial);
            smokeMesh.position.x = pos.x + MathUtil.randomRange(-0.1, 0.1);
            smokeMesh.position.y = pos.y + MathUtil.randomRange(-0.1, 0.1);
            smokeMesh.position.z = this._positionZ + MathUtil.randomRange(-0.1, 0.1);
            const smoke = new RenderParticle();
            smoke.setMesh(smokeMesh);
            smoke.setUpdate(() => {
                smoke.mesh().scale.multiplyScalar(0.9);
            });
            particles.add(smoke, 400);
            this._lastSmoke = Date.now();
        }
    }
}
