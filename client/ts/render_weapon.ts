import * as THREE from 'three';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js'
import {Howl} from 'howler';

import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderMesh } from './render_mesh.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderWeapon extends RenderMesh {
	private readonly _shotLocation = "shoot";

	private readonly _rayMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff00} );

	private _shotOrigin : THREE.Vector3;
	private _light : THREE.SpotLight;

	constructor() {
		super();

		this._shotOrigin = new THREE.Vector3(0, 0, 0);
		this._light = new THREE.SpotLight(0x00ff00, 0, 6, Math.PI / 5);

		if (options.enableShadows) {
			// this._light.castShadow = true;
		}
	}

	override setMesh(mesh : THREE.Object3D) : void {
		mesh.rotation.x = Math.PI / 2;
		mesh.scale.z = -1;

		this._shotOrigin = mesh.getObjectByName(this._shotLocation).position.clone();
		super.setMesh(mesh);
	}

	setModel(model : Model) {
		loader.load(model, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);

/*
			if (model === Model.UZI) {
				this._light.intensity = 2;
				this._light.position.copy(this._shotOrigin);
				this._light.position.y += 0.1;
				this._light.target.position.z = 1;
				mesh.add(this._light);
				mesh.add(this._light.target);
			} else {
				this._light.intensity = 0;
			}
*/
		});
	}

	shotOrigin() : THREE.Vector3 {
		return this._shotOrigin.clone();
	}
}