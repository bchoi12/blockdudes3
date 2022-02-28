import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { MathUtil } from './util.js'

export class RenderProjectile extends RenderObject {

	private _lastSmoke : number;

	constructor(space : number, id : number) {
		super(space, id);
		this._lastSmoke = 0;
	}

	override setMesh(mesh : THREE.Mesh) : void {
		mesh.rotation.y = Math.PI / 2;
		super.setMesh(mesh);
	}

	override update(msg : Map<number, any>) : void {
		super.update(msg);

		if (!this.hasMesh()) {
			return;
		}

		const vel = this.vel();
		const projectile = this._mesh.getObjectByName("mesh");
		const angle = vel.angle() * -1;

		projectile.rotation.x = angle;
		projectile.rotateZ(.12);

		// TODO: make this an actual particle system
		if (Date.now() - this._lastSmoke >= 20) {
			const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial( {color: 0xbbbbbb , transparent: true, opacity: 0.5} ));
			smoke.position.copy(this._mesh.position);
			renderer.sceneMap().scene().add(smoke);

			setTimeout(() => {
				renderer.sceneMap().scene().remove(smoke);
			}, 300);

			this._lastSmoke = Date.now();
		}
	}
}

