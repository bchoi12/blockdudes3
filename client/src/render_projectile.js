import { game } from './game.js';
import { RenderObject } from './render_object.js';
import { renderer } from './renderer.js';
import { Util } from './util.js';
export class RenderProjectile extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._positionZ = 0.5;
    }
    setSound(sound) {
        this._sound = sound;
    }
    ready() {
        return super.ready() && this.hasOwner();
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        mesh.position.z = this._positionZ;
    }
    initialize() {
        super.initialize();
        const owner = this.owner();
        if (owner.valid() && owner.space() === playerSpace) {
            const player = game.sceneMap().get(owner.space(), owner.id());
            player.shoot();
        }
        if (Util.defined(this._sound)) {
            renderer.playSound(this._sound, this.pos());
        }
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!this.hasMesh()) {
            return;
        }
        if (this.mesh().position.z > 0) {
            this.mesh().position.z -= .02;
        }
    }
}
