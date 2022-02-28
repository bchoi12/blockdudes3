import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderMesh } from './render_mesh.js'
import { renderer } from './renderer.js'

export class RenderWeapon extends RenderMesh {
	private readonly _shotLocation = "shoot";

	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0x00ff00, linewidth: 3} );
	private readonly _bombMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 3} );

	private _shotOrigin : THREE.Vector3;
	private _light : THREE.PointLight;

	private _shootSound : Howl;
	private _blastSound : Howl;

	constructor() {
		super();

		this._shotOrigin = new THREE.Vector3(0, 0, 0);
		this._light = new THREE.PointLight(0x00ff00, 0, 3);
		this._shootSound = new Howl({
			src: ["./sound/test.wav"]
		});
		this._blastSound = new Howl({
			src: ["./sound/test2.wav"]
		});
	}

	override setMesh(mesh : THREE.Mesh) : void {
		mesh.rotation.x = Math.PI / 2;
		mesh.scale.z = -1;

		this._shotOrigin = mesh.getObjectByName(this._shotLocation).position;
		this._light.position.copy(this._shotOrigin);
		mesh.add(this._light)

		super.setMesh(mesh);
	}

	shoot(msg : Map<number, any>) {
		super.update(msg);

		const pos = this.pos();
		if (msg[shotTypeProp] == rocketShotType) {
			renderer.playSound(this._blastSound, new THREE.Vector3(pos.x, pos.y, 0));
			this._blastSound.play();
			return;
		}

		// TODO: remove dependence from having the mesh loaded so we can shoot before the mesh exists.
		const endpoint = msg[endPosProp];
		const points = [
			this._shotOrigin,
			this._mesh.worldToLocal(new THREE.Vector3(endpoint.X, endpoint.Y, 0)),
		];

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = msg[shotTypeProp] == burstShotType ? this._lineMaterial : this._bombMaterial;
		const line = new THREE.Line(geometry, material);
		this._mesh.add(line);

		// TODO: make a singleton map for this
		if (msg[shotTypeProp] == burstShotType) {
			this._light.color.setHex(0x00ff00);
		} else {
			this._light.color.setHex(0x0000ff);
		}
		this._light.intensity = 3;

		renderer.playSound(this._shootSound, this._mesh.localToWorld(this._mesh.position.clone()));
		this._shootSound.play();

		setTimeout(() => {
			this._mesh.remove(line);
			this._light.intensity = 0;
		}, 50);
	}
}

