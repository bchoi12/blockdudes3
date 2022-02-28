import { RenderMesh } from './render_mesh.js';
import { GameUtil } from './util.js';
export class RenderObject extends RenderMesh {
    constructor(space, id) {
        super();
        this._space = space;
        this._id = id;
        this._activeActions = new Set();
        this._lastMixerUpdate = Date.now();
    }
    update(msg) {
        super.update(msg);
        if (!this.hasMesh()) {
            return;
        }
        const mesh = this.mesh();
        const pos = this.pos();
        mesh.position.x = pos.x;
        mesh.position.y = pos.y;
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        if (this._msg.hasOwnProperty(posProp)) {
            mesh.position.x = this._msg[posProp].X;
            mesh.position.y = this._msg[posProp].Y;
        }
        mesh.name = GameUtil.sid(this._space, this._id);
    }
    space() {
        return this._space;
    }
    id() {
        return this._id;
    }
    updateMixer() {
        const now = Date.now();
        const seconds = (now - this._lastMixerUpdate) / 1000;
        this._mixer.update(seconds);
        this._lastMixerUpdate = now;
    }
    setWeight(action, weight) {
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }
    fadeIn(action, duration) {
        if (!this._activeActions.has(action)) {
            this._actions.get(action).reset();
            this._actions.get(action).fadeIn(duration);
            this._activeActions.add(action);
        }
    }
    fadeOut(action, duration) {
        if (this._activeActions.has(action)) {
            this._actions.get(action).reset();
            this._actions.get(action).fadeOut(duration);
            this._activeActions.delete(action);
        }
    }
    fadeTo(startAction, endAction, duration) {
        this.fadeOut(startAction, duration);
        this.fadeIn(endAction, duration);
    }
}
