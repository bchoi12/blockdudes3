import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderPellet extends RenderProjectile {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0xdede1d });
	private readonly _trailMaterial = new THREE.MeshStandardMaterial( {color: 0xdede1d, transparent: true, opacity: 0.7 });

	private _light : THREE.PointLight;

	constructor(space : number, id : number) {
		super(space, id);
		this.setSound(Sound.PEW);
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.dim().x / 2, this.dim().x / 2, 0.1, 8), this._material);
		mesh.rotation.x = Math.PI / 2;
		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
		game.sceneMap().returnPointLight(this._light);
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);
		super.addTrail(this._trailMaterial, 0.7);

		renderer.addBloom(mesh);

		this._light = game.sceneMap().getPointLight();
		if (Util.defined(this._light)) {
			this._light.color = new THREE.Color(0xffffa6);
			this._light.intensity = 1.0;
			this._light.distance = 3.0;
			mesh.add(this._light);
		}
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}
	}
}

