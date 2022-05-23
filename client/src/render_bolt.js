import { Sound } from './audio.js';
import { RenderObject } from './render_object.js';
import { Model, loader } from './loader.js';
import { game } from './game.js';
import { renderer } from './renderer.js';
export class RenderBolt extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._positionZ = 0.5;
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
        renderer.playSound(Sound.PEW, this.pos());
        loader.load(Model.BOLT, (mesh) => {
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
        const vel = this.vel();
        const dir = vel.clone().normalize();
        const angle = vel.angle() * -1;
        const projectile = this.mesh().getObjectByName("mesh");
        projectile.rotation.x = angle;
    }
}
