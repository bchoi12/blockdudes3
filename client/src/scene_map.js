import * as THREE from 'three';
import { Lighting } from './lighting.js';
import { particles } from './particles.js';
import { LogUtil, Util } from './util.js';
import { Weather } from './weather.js';
export class SceneMap {
    constructor() {
        this.reset();
    }
    scene() { return this._scene; }
    reset() {
        this._scene = new THREE.Scene();
        this._renders = new Map();
        this._deleted = new Map();
        this._components = new Array();
        this.addComponent(new Lighting());
        this.addComponent(new Weather());
        this.addComponent(particles);
    }
    addComponent(component) {
        this._components.push(component);
        this._scene.add(component.scene());
    }
    updateComponents(position) {
        this._components.forEach((component) => {
            component.update(position);
        });
    }
    add(space, id, object) {
        const map = this.getMap(space);
        if (map.has(id)) {
            LogUtil.d("Overwriting object space " + space + ", id " + id + "!");
        }
        map.set(id, object);
        object.onMeshLoad(() => {
            if (this.has(space, id)) {
                this._scene.add(object.mesh());
            }
        });
    }
    has(space, id) {
        const map = this.getMap(space);
        return map.has(id) && Util.defined(map.get(id));
    }
    deleted(space, id) {
        if (!this._deleted.has(space)) {
            return false;
        }
        return this._deleted.get(space).has(id);
    }
    get(space, id) {
        const map = this.getMap(space);
        return map.get(id);
    }
    delete(space, id) {
        const map = this.getMap(space);
        if (map.has(id)) {
            this._scene.remove(map.get(id).mesh());
            wasmDelete(space, id);
            map.delete(id);
            if (!this._deleted.has(space)) {
                this._deleted.set(space, new Set());
            }
            this._deleted.get(space).add(id);
        }
    }
    clear(space) {
        const map = this.getMap(space);
        map.forEach((object, id) => {
            this.delete(space, id);
        });
        map.clear();
    }
    clearObjects() {
        this._renders.forEach((render, space) => {
            if (space != playerSpace) {
                this.clear(space);
            }
        });
    }
    update(space, id, msg, seqNum) {
        const map = this.getMap(space);
        const object = map.get(id);
        if (!Util.defined(object)) {
            this.delete(space, id);
            return;
        }
        object.update(msg, seqNum);
        if (!object.initialized() && object.ready()) {
            object.initialize();
            wasmAdd(space, id, object.data());
        }
        if (wasmHas(space, id)) {
            wasmSetData(space, id, object.data());
        }
        if (object.deleted()) {
            this.delete(space, id);
        }
    }
    renderShots(shots) {
        shots.forEach((shot) => {
            const sid = shot[spacedIdProp];
            const owner = this.get(sid.S, sid.Id);
            owner.shoot(shot);
        });
    }
    getMap(space) {
        if (!this._renders.has(space)) {
            this._renders.set(space, new Map());
        }
        return this._renders.get(space);
    }
}
