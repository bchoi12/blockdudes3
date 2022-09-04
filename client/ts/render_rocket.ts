import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { Model, loader } from './loader.js'
import { Particle, Particles } from './particles.js'
import { SceneComponentType } from './scene_component.js'
import { RenderCustom } from './render_custom.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

export class RenderRocket extends RenderProjectile {
	private readonly _smokeMaterial = new THREE.MeshLambertMaterial( {color: 0xbbbbbb} );
	private readonly _smokeInterval = 30;
	private readonly _rotateZ = 8;

	private _light : THREE.PointLight;
	private _lastSmoke : number;

	constructor(space : number, id : number) {
		super(space, id);
		this._lastSmoke = 0;

		this.setSound(Sound.ROCKET);
	}

	override initialize() : void {
		super.initialize();
		loader.load(Model.ROCKET, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override delete() : void {
		super.delete();

		if (Util.defined(this._light)) {
			this._light.intensity = 0;
		}
	}

	override setMesh(mesh : THREE.Object3D) : void {
		super.setMesh(mesh);
		mesh.rotation.y = Math.PI / 2;
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const pos = this.pos();
		const dir = this.dir();
		const dim = this.dim();

		const projectile = this.mesh().getObjectByName("mesh");
		projectile.rotation.x = dir.angle() * -1;
		projectile.rotation.z += this._rotateZ * this.timestep();

		if (Date.now() - this._lastSmoke >= this._smokeInterval) {
			game.particles().emit(Particle.SMOKE, 400, (mesh : THREE.Object3D, ts : number) => {
				mesh.scale.multiplyScalar(0.9);
			}, {
				position: new THREE.Vector3(
					pos.x - dim.x / 2 * dir.x + MathUtil.randomRange(-0.1, 0.1),
					pos.y - dim.y / 2 * dir.y + MathUtil.randomRange(-0.1, 0.1),
					this.mesh().position.z + MathUtil.randomRange(-0.1, 0.1),
				),
				scale: MathUtil.randomRange(0.1, 0.15),
			});
			this._lastSmoke = Date.now();
		}
	}
}

