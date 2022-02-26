import * as THREE from 'three';
import { Howl } from 'howler';
import { RenderObject } from './render_object.js';
import { renderer } from './renderer.js';
export class RenderExplosion extends RenderObject {
    constructor(mesh) {
        super(mesh);
        this._light = new THREE.PointLight(0xff0000, 3, 3);
        mesh.add(this._light);
        this._sound = new Howl({
            src: ["./sound/test3.wav"]
        });
        renderer.compile(mesh);
        this._exploded = false;
    }
    update(msg) {
        if (!this._exploded && msg.hasOwnProperty(posProp)) {
            const pos = msg[posProp];
            this._mesh.position.x = pos.X;
            this._mesh.position.y = pos.Y;
            renderer.adjustSound(this._sound, this._mesh.position);
            console.log(this._mesh.position);
            this._sound.play();
            this._exploded = true;
        }
    }
}
