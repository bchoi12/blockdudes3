import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { Particle, Particles } from './particles.js'
import { RenderCustom } from './render_custom.js'
import { RenderProjectile } from './render_projectile.js'
import { MathUtil, Util } from './util.js'

export class RenderPellet extends RenderProjectile {
	private readonly _material = new THREE.MeshPhongMaterial( {color: 0xf6ff00 });
	private readonly _particleColors = [0xf6ff00, 0xffc800, 0xff9100];
	private readonly _particleInterval = 30;

	private _lastParticle : number;
	private _lastPos : THREE.Vector3;

	constructor(space : number, id : number) {
		super(space, id);

		this._lastParticle = Date.now();

		this.setSound(Sound.BIT_PEW);
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.dim().x / 2, this.dim().x / 2, 0.1, 8), this._material);
		mesh.rotation.x = Math.PI / 2;
		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();

		const pos = this.pos3();
		game.particles().emit(Particle.SPARKS, 100, (object : THREE.InstancedMesh, ts : number) => {
			const scale = object.scale.x + 6 * ts;
			object.scale.set(scale, scale, scale);
		}, {
			position: this.pos3(),
			scale: 0,
			instances: {
				posFn: () => {
					let pos = new THREE.Vector3();
					pos.setFromSphericalCoords(1.0, MathUtil.randomRange(0, Math.PI), MathUtil.randomRange(0, 2 * Math.PI));
					return pos;
				},
				scaleFn: () => {
					return new THREE.Vector3(0.08, 0.08, 0.08);
				},
				colorFn: () => {
					return new THREE.Color(Util.randomElement(this._particleColors));
				},
			},
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);
	}

	override update() : void {
		super.update();

		if (Util.defined(this._lastPos) && Date.now() - this._lastParticle >= this._particleInterval) {
			const initialScale = 0.3 * this.dim().x;
			let particle = game.particles().emit(Particle.CUBE, 200, (object : THREE.Object3D, ts : number) => {
				const scale = Math.max(object.scale.x - 0.3 * ts, 0);
				object.scale.x = scale;
				object.scale.y = scale;
			}, {
				position: this._lastPos,
				scale: initialScale,
			});

			this._lastParticle = Date.now();
		}

		this._lastPos = this.pos3().clone();
	}
}

