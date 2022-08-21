import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderBolt extends RenderProjectile {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0x47def5 });
	private readonly _tailMaterial = new THREE.MeshStandardMaterial( {color: 0xffd663 });

	private _soundId : number;
	private _light : THREE.PointLight;

	constructor(space : number, id : number) {
		super(space, id);
	}

	override initialize() : void {
		super.initialize();

		if (this.attribute(chargedAttribute)) {
			this._soundId = renderer.playSound(Sound.TOM_SCREAM, this.pos());
		} else {
			renderer.playSound(Sound.LASER, this.pos());
		}

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 0.2), this._material);
		const tail = new THREE.Mesh(new THREE.BoxGeometry(dim.x * 0.3, dim.y, 0.2), this._tailMaterial);
		tail.position.x = -0.65 * dim.x
		mesh.add(tail);
		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
		game.sceneMap().returnPointLight(this._light);

		if (Util.defined(this._soundId)) {
			renderer.stopSound(Sound.TOM_SCREAM, this._soundId);
		}
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);
		super.addTrail(this._tailMaterial, 1);

		renderer.addBloom(mesh);

		this._light = game.sceneMap().getPointLight();
		if (Util.defined(this._light)) {
			this._light.color = new THREE.Color(0x98fafa);

			if (this.dim().x > 0.5) {
				this._light.intensity = 4.0;
				this._light.distance = 10.0;
			} else {
				this._light.intensity = 2.0;
				this._light.distance = 4.0;
			}
			mesh.add(this._light);
		}
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (Util.defined(this._soundId)) {
			renderer.adjustSoundPos(Sound.TOM_SCREAM, this._soundId, this.pos());
		}

		this.mesh().rotation.z = this.dir().angle();
	}
}

