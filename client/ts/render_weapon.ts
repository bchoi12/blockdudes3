import * as THREE from 'three';
import {Howl} from 'howler';

import { particles } from './particles.js'
import { RenderMesh } from './render_mesh.js'
import { RenderObject } from './render_object.js'
import { RenderParticle } from './render_particle.js'
import { renderer } from './renderer.js'

export class RenderWeapon extends RenderMesh {
	private readonly _shotLocation = "shoot";

	private readonly _rayMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff00} );

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
			return;
		}

		const localPos = this.endPos().sub(this.pos());
		const range = localPos.length();

		const geometry = new THREE.BoxGeometry(0.1, 0.1, range);
		const ray = new THREE.Mesh(geometry, this._rayMaterial);

		const parentAngle = this.parent().weaponDir().angle();
		const angleDiff = parentAngle - localPos.angle();

		console.log(parentAngle + " " + localPos.angle() + " " + angleDiff);

		ray.position.y = Math.sin(angleDiff) * range / 2;
		ray.position.z = Math.cos(angleDiff) * range / 2;

		this._mesh.add(ray);

		// TODO: make a singleton map for this
		if (msg[shotTypeProp] == burstShotType) {
			this._light.color.setHex(0x00ff00);
		} else {
			this._light.color.setHex(0x0000ff);
		}
		this._light.intensity = 3;

		renderer.playSound(this._shootSound, new THREE.Vector3(pos.x, pos.y, 0));

		setTimeout(() => {
			this._mesh.remove(ray);
			this._light.intensity = 0;
		}, 60);
	}
}

