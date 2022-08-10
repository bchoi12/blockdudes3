import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderProjectile extends RenderObject {
	private readonly _positionZ = 0.5;

	private _sound : Sound;

	constructor(space : number, id : number) {
		super(space, id);
	}

	protected setSound(sound : Sound) {
		this._sound = sound;
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner();
	}

	override setMesh(mesh : THREE.Object3D) : void {
		super.setMesh(mesh);
		mesh.position.z = this._positionZ;
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		if (owner.valid() && owner.space() === playerSpace && game.sceneMap().has(owner.space(), owner.id())) {
			const player : RenderPlayer = game.sceneMap().getAsAny(owner.space(), owner.id());
			player.shoot();
		}

		if (Util.defined(this._sound)) {
			renderer.playSound(this._sound, this.pos());
		}
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (this.mesh().position.z > 0) {
			this.mesh().position.z -= 2 * this.timestep();
		}
	}
}

