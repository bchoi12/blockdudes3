import * as THREE from 'three';
class Options {
    constructor() {
        THREE.Cache.enabled = true;
        this.pointerLock = true;
        this.enableShadows = true;
        this.rendererScale = 0.66;
    }
    load() {
    }
    save() {
    }
}
export const options = new Options();
