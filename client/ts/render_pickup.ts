import * as THREE from 'three';

import { Model, loader } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'

export class RenderPickup extends RenderObject {

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasWeaponType();
	}

	override initialize() : void {
		super.initialize();

		let model = Model.UNKNOWN;
		if (this.weaponType() === uziWeapon) {
			model = Model.UZI;
		} else if (this.weaponType() === bazookaWeapon) {
			model = Model.BAZOOKA;
		}

		loader.load(model, (mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		this.mesh().rotation.y += 0.01;
		this.mesh().rotation.x += 0.005;
	}
}

