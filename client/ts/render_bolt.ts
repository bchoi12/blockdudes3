import * as THREE from 'three';

import { Sound } from './audio.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'

import { Model, loader } from './loader.js'
import { game } from './game.js'
import { renderer } from './renderer.js'

export class RenderBolt extends RenderObject {
	private readonly _positionZ = 0.5;

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner();
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		if (owner.valid() && owner.space() === playerSpace) {
			const player : any = game.sceneMap().get(owner.space(), owner.id());
			player.shoot();
		}

		renderer.playSound(Sound.PEW, this.pos());
		loader.load(Model.BOLT, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Mesh) : void {
		super.setMesh(mesh);
		mesh.rotation.y = Math.PI / 2;
		mesh.position.z = this._positionZ;
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		const vel = this.vel();
		const dir = vel.clone().normalize();
		const angle = vel.angle() * -1;

		const projectile = this.mesh().getObjectByName("mesh");
		projectile.rotation.x = angle;
	}
}

