import * as THREE from 'three';
import { Howl } from 'howler';
import { RenderObject } from './render_object.js';
import { renderer } from './renderer.js';
export class RenderExplosion extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._light = new THREE.PointLight(0xff0000, 0, 6);
        this._sound = new Howl({
            src: ["./sound/test3.wav"]
        });
        this._exploded = false;
    }
    setMesh(mesh) {
        mesh.add(this._light);
        super.setMesh(mesh);
    }
    update(msg) {
        super.update(msg);
        if (!this.hasMesh()) {
            return;
        }
        if (!this._exploded) {
            renderer.playSound(this._sound, this._mesh.position);
            this._light.intensity = 3;
            this._exploded = true;
        }
    }
}
