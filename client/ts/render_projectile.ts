import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderObject } from './render_object.js'
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
		if (owner.valid() && owner.space() === playerSpace) {
			const player : any = game.sceneMap().get(owner.space(), owner.id());
			player.shoot();
		}

		if (Util.defined(this._sound)) {
			renderer.playSound(this._sound, this.pos());
		}
	}

	override update(msg : { [k: string]: any }, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		if (this.mesh().position.z > 0) {
			this.mesh().position.z -= .02;
		}
	}
}

