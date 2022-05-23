import * as THREE from 'three';
import { Sound } from './audio.js';
import { SceneComponentType } from './scene_component.js';
import { RenderObject } from './render_object.js';
import { RenderCustom } from './render_custom.js';
import { MathUtil } from './util.js';
import { Model, loader } from './loader.js';
import { game } from './game.js';
import { renderer } from './renderer.js';
export class RenderProjectile extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._smokeMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.5 });
        this._smokeInterval = 15;
        this._rotateZ = 0.12;
        this._positionZ = 0.5;
        this._lastSmoke = 0;
    }
    ready() {
        return super.ready() && this.hasOwner();
    }
    initialize() {
        super.initialize();
        const owner = this.owner();
        if (owner.valid() && owner.space() === playerSpace) {
            const player = game.sceneMap().get(owner.space(), owner.id());
            player.shoot();
        }
        renderer.playSound(Sound.ROCKET, this.pos());
        loader.load(Model.ROCKET, (mesh) => {
            this.setMesh(mesh);
        });
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        mesh.rotation.y = Math.PI / 2;
        mesh.position.z = this._positionZ;
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!this.hasMesh()) {
            return;
        }
        const pos = this.pos();
        const vel = this.vel();
        const dim = this.dim();
        const dir = vel.clone().normalize();
        const angle = vel.angle() * -1;
        const projectile = this.mesh().getObjectByName("mesh");
        projectile.rotation.x = angle;
        projectile.rotateZ(this._rotateZ);
        if (Date.now() - this._lastSmoke >= this._smokeInterval) {
            const smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(MathUtil.randomRange(0.1, 0.2), 3, 3), this._smokeMaterial);
            smokeMesh.position.x = pos.x - dim.x / 2 * dir.x + MathUtil.randomRange(-0.1, 0.1);
            smokeMesh.position.y = pos.y - dim.y / 2 * dir.y + MathUtil.randomRange(-0.1, 0.1);
            smokeMesh.position.z = this._positionZ + MathUtil.randomRange(-0.1, 0.1);
            const smoke = new RenderCustom();
            smoke.setMesh(smokeMesh);
            smoke.setUpdate(() => {
                smoke.mesh().scale.multiplyScalar(0.9);
            });
            game.sceneComponent(SceneComponentType.PARTICLES).addCustomTemp(smoke, 400);
            this._lastSmoke = Date.now();
        }
    }
}
