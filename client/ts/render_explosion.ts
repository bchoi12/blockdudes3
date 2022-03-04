import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderExplosion extends RenderObject {

	private _sound : Howl;
	private _exploded : boolean;

	constructor(space : number, id : number) {
		super(space, id);

		this._sound = new Howl({
			src: ["./sound/test3.wav"]
		});
		this._exploded = false;
	}

	override setMesh(mesh : THREE.Mesh) {
		super.setMesh(mesh);
	}

	override update(msg : Map<number, any>) : void {
		super.update(msg);

		if (!this.hasMesh()) {
			return;
		}

		if (!this._exploded) {
			renderer.playSound(this._sound, this._mesh.position);
			this._exploded = true;
		}
	}
}

