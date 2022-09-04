import * as THREE from 'three';

import { EffectType } from './effects.js'
import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderBolt extends RenderProjectile {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0xffa424 });

	private _soundId : number;

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
		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
		renderer.setEffect(EffectType.BLOOM, false, this.mesh());

		if (Util.defined(this._soundId)) {
			renderer.fadeoutSound(Sound.TOM_SCREAM, this._soundId);
		}
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		renderer.setEffect(EffectType.BLOOM, true, mesh);
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

