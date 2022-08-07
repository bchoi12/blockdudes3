import * as THREE from 'three';

import { Model, loader } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderPickup extends RenderObject {

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasWeaponType();
	}

	override initialize() : void {
		super.initialize();

		const model = loader.getWeaponModel(this.weaponType());
		loader.load(model, (mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		mesh.rotation.x = this.id() * 0.15 * Math.PI
		mesh.rotation.y = this.id() * 0.3 * Math.PI

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}

		renderer.addOutline(mesh.getObjectByName("mesh"));
	}

	override update(msg : { [k: string]: any }, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		this.mesh().rotation.y += 1.2 * this.timestep();
		this.mesh().rotation.x += 0.6 * this.timestep();
	}
}

