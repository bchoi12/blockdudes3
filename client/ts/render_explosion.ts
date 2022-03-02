import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderExplosion extends RenderObject {

	private _light : THREE.PointLight;
	private _sound : Howl;
	private _exploded : boolean;

	constructor(space : number, id : number) {
		super(space, id);

		this._light = new THREE.PointLight(0xff0000, 0, 3);
		this._sound = new Howl({
			src: ["./sound/test3.wav"]
		});
		this._exploded = false;
	}

	override setMesh(mesh : THREE.Mesh) {
		mesh.add(this._light);
		super.setMesh(mesh);
	}

	override update(msg : Map<number, any>) : void {
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

