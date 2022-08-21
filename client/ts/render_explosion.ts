import * as THREE from 'three';

import { Sound } from './audio.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderExplosion extends RenderObject {
	private _exploded : boolean;
	private _scale : number;

	constructor(space : number, id : number) {
		super(space, id);

		this._exploded = false;
		this._scale = 1;
	}

	override ready() : boolean {
		return super.ready() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();
		const material = new THREE.MeshStandardMaterial({color: this.color() });
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(this.dim().x / 2, 12, 8), material);

		this.setMesh(mesh);
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}

		this.scale(0.1);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (this._scale < 1) {
			this._scale = Math.min(this._scale + this.timestep() * 12, 1);
			this.scale(this._scale);
		}

		if (!this._exploded) {
			renderer.playSound(Sound.EXPLOSION, this.pos());
			this._exploded = true;
		}
	}

	private scale(scale : number) : void {
		this._scale = scale;
		this.mesh().scale.copy(new THREE.Vector3(scale, scale, scale));
	}
}

