import * as THREE from 'three';

import { Model, loader } from './loader.js'
import { RenderObject } from './render_object.js'

export class RenderPickup extends RenderObject {

	constructor(space : number, id : number) {
		super(space, id);
	}

	override initialize() : void {
		super.initialize();

		loader.load(Model.UZI, (mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Mesh) {
		super.setMesh(mesh);
		mesh.receiveShadow = true;
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

