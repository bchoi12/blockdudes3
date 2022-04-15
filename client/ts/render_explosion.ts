import * as THREE from 'three';

import { Sound } from './audio.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderExplosion extends RenderObject {

	private readonly _material = new THREE.MeshStandardMaterial( {color: 0xbb4444 } );

	private _exploded : boolean;

	constructor(space : number, id : number) {
		super(space, id);
		this._exploded = false;
	}

	override initialize() : void {
		super.initialize();
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(this.dim().x / 2, 12, 8), this._material);
		this.setMesh(mesh);
	}

	override setMesh(mesh : THREE.Mesh) {
		super.setMesh(mesh);
		mesh.receiveShadow = true;
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		if (this._exploded) {
			return;
		}

		renderer.playSound(Sound.EXPLOSION, this.pos());
		this._exploded = true;
	}
}

