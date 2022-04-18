import * as THREE from 'three';
import { RenderObject } from './render_object.js';
import { Util } from './util.js';
export class RenderAnimatedObject extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._lastMixerUpdate = Date.now();
        this._actions = new Map();
        this._actionGroups = new Map();
        this._activeActions = new Set();
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        this._mixer = new THREE.AnimationMixer(mesh);
    }
    update(msg, seqNum) {
        super.update(msg, seqNum);
        if (!Util.defined(this._mixer)) {
            return;
        }
        const now = Date.now();
        const seconds = (now - this._lastMixerUpdate) / 1000;
        this._mixer.update(seconds);
        this._lastMixerUpdate = now;
    }
    initializeClip(action) {
        const mesh = this.mesh();
        const clip = this._mixer.clipAction(THREE.AnimationClip.findByName(mesh.animations, action));
        this.setWeight(clip, 1.0);
        clip.play();
        this._activeActions.add(action);
        this._actions.set(action, clip);
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
