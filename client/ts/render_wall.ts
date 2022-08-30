import * as THREE from 'three';

import { options } from './options.js'
import { RenderObject } from './render_object.js'

export class RenderWall extends RenderObject {
	private readonly _material = new THREE.MeshStandardMaterial( {color: 0, wireframe: true, depthTest: false } );

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready();
	}

	override initialize() : void {
		super.initialize();

		if (false) {
			const dim = this.dim();
			let mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 1), this._material);	
			mesh.position.copy(this.pos3());
			mesh.renderOrder = 1;

			if (false) {
				mesh.castShadow = options.enableShadows;
				mesh.receiveShadow = options.enableShadows;
				mesh.matrixAutoUpdate = false;
				mesh.updateMatrix();			
			}

			this.setMesh(mesh);
		}
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

