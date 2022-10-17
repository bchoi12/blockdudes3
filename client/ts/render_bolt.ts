import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { Particle } from './particles.js'
import { RenderCustom } from './render_custom.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

export class RenderBolt extends RenderProjectile {
	private _laser : RenderCustom;
	private _soundId : number;

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();

		if (this.attribute(chargedAttribute)) {
			this._soundId = renderer.playSound(Sound.TOM_SCREAM, this.pos());
		} else {
			renderer.playSound(Sound.LASER, this.pos());
		}

		const color = new THREE.Color(this.color());
		const dim = this.dim();
		this._laser = game.particles().emit(Particle.LASER, -1, (object, ts) => {
			object.position.copy(this.mesh().position);
			object.rotation.z = this.dir().angle();
		}, {
			position: this.pos3(),
			scale: new THREE.Vector3(dim.x, dim.y, 1),
			instances: {
				posFn: (object, i) => {
					return new THREE.Vector3(0, 0, 0.04 * i);
				},
				scaleFn: (object, i) => {
					return new THREE.Vector3(1, 1 - i / object.count * i / object.count, 0);
				},
				colorFn: (object, i) => {
					let r = 0xff * color.r * (i + 1) / object.count;
					let g = 0xff * color.g * (i + 1) / object.count;
					let b = 0xff * color.b * (i + 1) / object.count;
					return new THREE.Color(r, g, b);
				},
			}
		});

		this.setMesh(new THREE.Object3D());
	}

	override delete() : void {
		super.delete();

		game.particles().delete(Particle.LASER, this._laser);

		if (this.hasTarget()) {
			let sparkColors = [this.color()];
			let rotation = new THREE.Quaternion();
			rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.dir().angle());

			game.particles().emit(Particle.LASER_SPARKS, 75, (object : THREE.InstancedMesh, ts : number) => {
				for (let i = 0; i < object.count; ++i) {
					let matrix = new THREE.Matrix4();
					object.getMatrixAt(i, matrix);
					let pos = new THREE.Vector3();
					let rotation = new THREE.Quaternion();
					let scale = new THREE.Vector3();
					matrix.decompose(pos, rotation, scale);

					scale.x += (2 + i / object.count) * ts;

					let dir = new THREE.Vector3(1, 0, 0);
					dir.applyQuaternion(rotation);
					dir.multiplyScalar(-pos.length() - (7 + 3 * i / object.count) * ts);
					pos = dir;

					matrix.compose(pos, rotation, scale);
					object.setMatrixAt(i, matrix);
				}

				if (object.instanceMatrix) {
					object.instanceMatrix.needsUpdate = true;
				}
			}, {
				position: this.pos3(),
				scale: 1,
				rotation: rotation,
				instances: {
					scaleFn: () => {
						return new THREE.Vector3(0.1, 0.04, 0.04);
					},
					rotationFn: () => {
						let rotation = new THREE.Quaternion();
						rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), MathUtil.randomRange(-0.7, 0.7));
						return rotation;
					},
					colorFn: () => {
						return new THREE.Color(Util.randomElement(sparkColors));
					},
				},
			});
		}

		if (Util.defined(this._soundId)) {
			renderer.fadeoutSound(Sound.TOM_SCREAM, this._soundId);
		}
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		let lightPos = this.pos3().clone();
		lightPos.z = 1;
		const charged = this.attribute(chargedAttribute);
		let light = game.sceneMap().getPointLight({
			position: lightPos,
			intensity: charged ? 4 : 3,
			distance: charged ? 2 : 1,
			color: new THREE.Color(this.color()),
		});
		setTimeout(() => {
			game.sceneMap().returnPointLight(light);
		}, charged ? 200 : 100);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (Util.defined(this._soundId)) {
			renderer.adjustSoundPos(Sound.TOM_SCREAM, this._soundId, this.pos());
		}
	}
}

