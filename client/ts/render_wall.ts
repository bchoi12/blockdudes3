import * as THREE from 'three';

import { options } from './options.js'
import { RenderObject } from './render_object.js'

export class RenderWall extends RenderObject {
	private readonly _debugMaterial = new THREE.MeshBasicMaterial( {color: 0, wireframe: true, depthTest: false } );

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
			let mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 1), this._debugMaterial);	
			mesh.position.copy(this.pos3());
			mesh.renderOrder = 1;

			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();

			if (false) {
				mesh.castShadow = options.enableShadows;
				mesh.receiveShadow = options.enableShadows;
	
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

