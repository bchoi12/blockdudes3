import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { Model, loader } from './loader.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'

export class RenderBolt extends RenderProjectile {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0xa3fa98 });

	constructor(space : number, id : number) {
		super(space, id);
		this.setSound(Sound.PEW);
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner();
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 0.2), this._material);
		this.setMesh(mesh);
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}
		this.mesh().rotation.z = this.vel().angle();
	}
}
