import * as THREE from 'three';
import { Lighting } from './lighting.js';
import { LogUtil, Util } from './util.js';
import { Weather } from './weather.js';
export class Scene {
    constructor() {
        this.reset();
    }
    scene() { return this._scene; }
    reset() {
        this._scene = new THREE.Scene();
        this._lighting = new Lighting();
        this._scene.add(this._lighting.scene());
        this._weather = new Weather();
        this._scene.add(this._weather.scene());
        this._renders = new Map();
    }
    add(space, id, object) {
        const map = this.getMap(space);
        if (map.has(id)) {
            LogUtil.d("Overwriting object space " + space + ", id " + id + "!");
        }
        map.set(id, object);
        this._scene.add(object.mesh());
    }
    has(space, id) {
        const map = this.getMap(space);
        return map.has(id) && Util.defined(map.get(id));
    }
    get(space, id) {
        const map = this.getMap(space);
        return map.get(id);
    }
    delete(space, id) {
        const map = this.getMap(space);
        if (map.has(id)) {
            this._scene.remove(map.get(id).mesh());
            map.delete(id);
        }
    }
    clear(space) {
        const map = this.getMap(space);
        map.forEach((id, object) => {
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
    update(space, id, msg) {
        const map = this.getMap(space);
        const object = map.get(id);
        if (!Util.defined(object)) {
            this.delete(space, id);
            return;
        }
        object.update(msg);
    }
    renderShots(shots) {
        shots.forEach((shot) => {
            const sid = shot[spacedIdProp];
            const owner = this.get(sid.S, sid.Id);
            owner.shoot(shot);
        });
    }
    setPlayerPosition(position) {
        this._lighting.setTarget(position);
        this._weather.update();
    }
    getMap(space) {
        if (!this._renders.has(space)) {
            this._renders.set(space, new Map());
        }
        return this._renders.get(space);
    }
}
