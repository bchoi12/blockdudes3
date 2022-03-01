import * as THREE from 'three';
import {Howl} from 'howler';

import { particles } from './particles.js'
import { RenderObject } from './render_object.js'
import { RenderParticle } from './render_particle.js'
import { renderer } from './renderer.js'
import { MathUtil } from './util.js'

export class RenderProjectile extends RenderObject {
	private readonly _smokeMaterial = new THREE.MeshStandardMaterial( {color: 0xbbbbbb , transparent: true, opacity: 0.5} );
	private readonly _smokeInterval = 15;
	private readonly _rotateZ = 0.12;
	private readonly _positionZ = 0.5;

	private _lastSmoke : number;

	constructor(space : number, id : number) {
		super(space, id);
		this._lastSmoke = 0;
	}

	override setMesh(mesh : THREE.Mesh) : void {
		mesh.rotation.y = Math.PI / 2;
		mesh.position.z = this._positionZ;
		super.setMesh(mesh);
	}

	override update(msg : Map<number, any>) : void {
		super.update(msg);

		if (!this.hasMesh()) {
			return;
		}

		const pos = this.pos();
		const vel = this.vel();
		const angle = vel.angle() * -1;

		const projectile = this.mesh().getObjectByName("mesh");
		projectile.rotation.x = angle;
		projectile.rotateZ(this._rotateZ);

		if (Date.now() - this._lastSmoke >= this._smokeInterval) {
			const smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1 + 0.1 * Math.random(), 3, 3), this._smokeMaterial);
			smokeMesh.position.x = pos.x + MathUtil.randomRange(-0.1, 0.1);
			smokeMesh.position.y = pos.y + MathUtil.randomRange(-0.1, 0.1);
			smokeMesh.position.z = this._positionZ + MathUtil.randomRange(-0.1, 0.1);

			const smoke = new RenderParticle();
			smoke.setMesh(smokeMesh);
			smoke.setUpdate(() => {
				smoke.mesh().scale.multiplyScalar(0.9);
			});
			particles.add(smoke, 400);

			this._lastSmoke = Date.now();
		}
	}
}

