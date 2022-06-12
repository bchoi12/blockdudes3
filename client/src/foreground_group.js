import * as THREE from 'three';
import { options } from './options.js';
import { renderer } from './renderer.js';
export class ForegroundGroup {
    constructor(box) {
        this._maxOpacity = 1.0;
        this._minOpacity = 0.3;
        this._opacityChange = 0.03;
        this._boundingBox = box;
        this._scene = new THREE.Scene();
        this._materials = new Set();
        this._transparent = false;
        this._opacity = 1.0;
    }
    scene() { return this._scene; }
    add(mesh) {
        this._materials.add(mesh.material);
        if (options.enableShadows) {
            mesh.castShadow = false;
            mesh.receiveShadow = true;
        }
        this._scene.add(mesh);
        const shadow = new THREE.Mesh(mesh.geometry, new THREE.ShadowMaterial());
        shadow.position.copy(mesh.position);
        if (options.enableShadows) {
            shadow.castShadow = true;
            shadow.receiveShadow = false;
        }
        this._scene.add(shadow);
    }
    update() {
        const position = renderer.cameraTarget();
        this._transparent = this._boundingBox.containsPoint(new THREE.Vector2(position.x, position.y));
        if (this._transparent && this._opacity <= this._minOpacity) {
            return;
        }
        if (!this._transparent && this._opacity >= this._maxOpacity) {
            return;
        }
        if (this._transparent) {
            this._opacity = Math.max(this._minOpacity, this._opacity - this._opacityChange);
        }
        else {
            this._opacity = Math.min(this._maxOpacity, this._opacity + this._opacityChange);
        }
        this._materials.forEach((material) => {
            material.opacity = this._opacity;
        });
    }
}
