import * as THREE from 'three';

import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { Util } from './util.js'
import { WallBuilder, WallShape } from './wall_builder.js'

export class RenderWall extends RenderObject {
	private readonly _debugMaterial = new THREE.MeshBasicMaterial( {color: 0, wireframe: true, depthTest: false } );

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim3();
		let mesh : THREE.Mesh;
		if (this.attribute(visibleAttribute)) {
			let material = new THREE.MeshLambertMaterial({ color: this.color() });
			if (this.byteAttribute(typeByteAttribute) === platformWall) {
				let table = new WallBuilder(WallShape.SQUARE, this.dim3(), material);
				mesh = table.build();
			} else if (this.byteAttribute(subtypeByteAttribute) === tableWallSubtype) {
				mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, dim.z), material);
			} else {
				mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, dim.z), material);
			}

			mesh.castShadow = options.enableShadows;
			mesh.receiveShadow = options.enableShadows;
		} else if (options.debugShowWalls) {
			mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, 1), this._debugMaterial);	
			mesh.renderOrder = 1;
		}

		if (Util.defined(mesh)) {
			mesh.position.copy(this.pos3());
			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();
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

