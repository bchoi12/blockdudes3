import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { MathUtil } from './util.js'

export class RenderRocket extends RenderObject {

	private _lastSmoke : number;

	constructor(mesh : THREE.Mesh) {
		super(mesh);

		this._mesh.rotation.y = Math.PI / 2;
		renderer.compile(mesh);

		this._lastSmoke = 0;
	}

	override update(msg : any) : void {
		this._mesh.position.x = msg[posProp].X;
		this._mesh.position.y = msg[posProp].Y;

		const rocket = this._mesh.getObjectByName("mesh");
		const angle = new THREE.Vector2(msg[velProp].X, msg[velProp].Y).angle() * -1;

		rocket.rotation.x = angle;
		rocket.rotateZ(.12);

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

