import * as THREE from 'three';
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { RenderMesh } from './render_mesh.js'

export class RenderWeapon extends RenderMesh {
	constructor() {
		super();
	}

	override setMesh(mesh : THREE.Object3D) : void {
		mesh.rotation.x = Math.PI / 2;
		mesh.scale.z = -1;
		super.setMesh(mesh);
	}

	setModel(model : Model) {
		loader.load(model, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}
}