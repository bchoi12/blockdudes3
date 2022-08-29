import * as THREE from 'three';

import { options } from './options.js'
import { RenderObject } from './render_object.js'

export class RenderWall extends RenderObject {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasAttributes() && this.hasDimZ();
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, this.dimZ()), this._material);	
		if (options.enableShadows) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}

		mesh.position.copy(this.pos3());
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
		this.setMesh(mesh);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (this.vel().lengthSq() > 0) {
			this.mesh().updateMatrix();
		}
	}
}

