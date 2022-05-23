import * as THREE from 'three';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js'
import {Howl} from 'howler';

import { game } from './game.js'
import { RenderMesh } from './render_mesh.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderWeapon extends RenderMesh {
	private readonly _shotLocation = "shoot";

	private readonly _rayMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff00} );

	private _gyro : Gyroscope;
	private _shotOrigin : THREE.Vector3;
	private _light : THREE.PointLight;

	private _shootSound : Howl;

	constructor() {
		super();

		this._gyro = new Gyroscope();
		this._shotOrigin = new THREE.Vector3(0, 0, 0);
		this._light = new THREE.PointLight(0x00ff00, 0, 3);
		this._shootSound = new Howl({
			src: ["./sound/test.wav"]
		});
	}

	override setMesh(mesh : THREE.Mesh) : void {
		mesh.rotation.x = Math.PI / 2;
		mesh.scale.z = -1;

		this._shotOrigin = mesh.getObjectByName(this._shotLocation).position.clone();
		this._light.position.copy(this._shotOrigin);
		mesh.add(this._light)


		super.setMesh(mesh);
	}

	shotOrigin() : THREE.Vector3 {
		return this._shotOrigin.clone();
	}
}