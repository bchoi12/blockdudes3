import { RenderMesh } from './render_mesh.js';
export class RenderParticle extends RenderMesh {
    constructor() {
        super();
        this._hasUpdate = false;
    }
    setUpdate(update) {
        this._hasUpdate = true;
        this._update = update;
    }
    updateParticle(position) {
        if (!this._hasUpdate) {
            return;
        }
        this._update();
    }
}
