import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'

export class RenderWeapon extends RenderObject {
	private readonly _shotLocation = "shoot";

	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 3} );
	private readonly _bombMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 3} );

	private _shotOrigin : THREE.Vector3;
	private _light : THREE.PointLight;

	private _shootSound : Howl;
	private _blastSound : Howl;

	constructor(mesh : THREE.Mesh) {
		super(mesh);

		mesh.rotation.x = Math.PI / 2;
		mesh.scale.z = -1;

		this._shotOrigin = mesh.getObjectByName(this._shotLocation).position;

		this._light = new THREE.PointLight(0x00ff00, 0, 3);
		this._light.position.copy(this._shotOrigin);
		mesh.add(this._light)

		this._shootSound = new Howl({
			src: ["./sound/test.wav"]
		});
		this._blastSound = new Howl({
			src: ["./sound/test2.wav"]
		});

		renderer.compile(mesh);
	}

	shoot(shot : Map<number, any>) {
		if (shot[shotTypeProp] == rocketShotType) {
			renderer.adjustSound(this._blastSound, this._mesh.localToWorld(this._mesh.position.clone()));
			this._blastSound.play();
			return;
		}

		const endpoint = shot[endPosProp];
		const points = [
			this._shotOrigin,
			this._mesh.worldToLocal(new THREE.Vector3(endpoint.X, endpoint.Y, 0)),
		];

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = shot[shotTypeProp] == burstShotType ? this._lineMaterial : this._bombMaterial;
		const line = new THREE.Line(geometry, material);
		this._mesh.add(line);

		if (shot[shotTypeProp] == burstShotType) {
			this._light.color.setHex(0x00ff00);
		} else {
			this._light.color.setHex(0x0000ff);
		}
		this._light.intensity = 3;

		renderer.adjustSound(this._shootSound, this._mesh.localToWorld(this._mesh.position.clone()));
		this._shootSound.play();

		setTimeout(() => {
			this._mesh.remove(line);
			this._light.intensity = 0;
		}, 50);
	}
}

