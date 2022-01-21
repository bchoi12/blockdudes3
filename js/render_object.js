class RenderObject {
    constructor(mesh) {
        this._debugMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
        this._mesh = mesh;
        this._activeActions = new Set();
    }
    update(msg) {
        if (msg.hasOwnProperty(posProp)) {
            const pos = msg[posProp];
            this._mesh.position.x = pos.X;
            this._mesh.position.y = pos.Y;
        }
    }
    mesh() {
        return this._mesh;
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
