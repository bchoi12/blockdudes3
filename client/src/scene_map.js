import * as THREE from 'three';
import { Foreground } from './foreground.js';
import { Lighting } from './lighting.js';
import { Particles } from './particles.js';
import { SceneComponentType } from './scene_component.js';
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
        this._components = new Map();
        this.addComponent(SceneComponentType.LIGHTING, new Lighting());
        this.addComponent(SceneComponentType.WEATHER, new Weather());
        this.addComponent(SceneComponentType.PARTICLES, new Particles());
        this.addComponent(SceneComponentType.FOREGROUND, new Foreground());
    }
    addComponent(type, component) {
        this._components.set(type, component);
        this._scene.add(component.scene());
    }
    getComponent(type) {
        if (!this._components.has(type)) {
            console.error("Requested nonexistent component: " + type);
        }
        return this._components.get(type);
    }
    updateComponents() {
        this._components.forEach((component, type) => {
            component.update();
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
        }
        if (wasmHas(space, id)) {
            wasmSetData(space, id, object.data());
        }
        if (object.deleted()) {
            this.delete(space, id);
        }
    }
    getMap(space) {
        if (!this._renders.has(space)) {
            this._renders.set(space, new Map());
        }
        return this._renders.get(space);
    }
}
