import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

export class RenderExplosion extends RenderObject {
	private _scale : number;

	private _light : THREE.PointLight;

	constructor(space : number, id : number) {
		super(space, id);

		this._scale = 1;
	}

	override ready() : boolean {
		return super.ready() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();
		const material = new THREE.MeshStandardMaterial({color: this.color() });
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(this.dim().x / 2 + MathUtil.randomRange(-0.02, 0.02), 12, 8), material);

		renderer.playSound(Sound.EXPLOSION, this.pos());

		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
		game.sceneMap().returnPointLight(this._light);
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}
		this.scale(0.1);

		this._light = game.sceneMap().getPointLight();
		if (Util.defined(this._light)) {
			this._light.color = new THREE.Color(this.color());
			this._light.intensity = 6.0;
			this._light.distance = Math.max(4, this.dim().x * 2);
			mesh.add(this._light);
		}
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
	}

	private scale(scale : number) : void {
		this._scale = scale;
		this.mesh().scale.copy(new THREE.Vector3(scale, scale, scale));
	}
}

