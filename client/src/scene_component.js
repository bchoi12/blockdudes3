import * as THREE from 'three';
export class SceneComponent {
    constructor() {
        this._scene = new THREE.Scene();
    }
    scene() {
        return this._scene;
    }
}
