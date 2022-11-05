import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { options } from './options.js'
import { Particle } from './particles.js'
import { RenderCustom } from './render_custom.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

export class RenderExplosion extends RenderObject {
	// Copied from the server.
	private readonly _confettiColors = [0xc306d1, 0xed0505, 0xed8805, 0x020f9e, 0x5805ab];

	private _scale : number;
	private _confetti : RenderCustom;

	constructor(space : number, id : number) {
		super(space, id);

		this._scale = 1;
	}

	override ready() : boolean {
		return super.ready() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();

		let mesh;
		const radius = this.dim().x / 2;
		if (radius > 1) {
			const material = new THREE.MeshLambertMaterial({color: this.color() });
			// Add a random number for overlapping explosions
			mesh = new THREE.Mesh(new THREE.SphereGeometry(radius + (this.id() % 5) * 0.01, 12, 8), material);
			renderer.playSound(Sound.EXPLOSION, {pos: this.pos3()});
		} else {
			mesh = new THREE.Object3D();

			this._confetti = game.particles().emit(Particle.CONFETTI, 500, (object : THREE.InstancedMesh, ts) => {
				object.position.y -= 0.8 * ts;
				let scale = Math.min(object.scale.x + 10 * ts, 1);
				object.scale.set(scale, scale, scale);

				for (let i = 0; i < object.count; ++i) {
					let matrix = new THREE.Matrix4();
					object.getMatrixAt(i, matrix);
					let pos = new THREE.Vector3();
					let rotation = new THREE.Quaternion();
					let scale = new THREE.Vector3();
					matrix.decompose(pos, rotation, scale);

					rotation.random();
					matrix.compose(pos, rotation, scale);
					object.setMatrixAt(i, matrix);
				}

				if (object.instanceMatrix) {
					object.instanceMatrix.needsUpdate = true;
				}
			}, {
				position: this.pos3(),
				scale: 0.1,
				instances: {
					posFn: () => {
						let pos = new THREE.Vector3();
						pos.setFromSphericalCoords(radius, MathUtil.randomRange(0, Math.PI), MathUtil.randomRange(0, 2 * Math.PI));
						return pos;
					},
					scaleFn: () => {
						return new THREE.Vector3(0.1, 0.1, 0);
					},
					rotationFn: () => {
						let quaternion = new THREE.Quaternion();
						quaternion.random();
						return quaternion;
					},
					colorFn: () => {
						return new THREE.Color(Util.randomElement(this._confettiColors));
					},
				},
			});

			renderer.playSound(Sound.PEW, {pos: this.pos()});
		}

		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}
		this.scale(0.1);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (this._scale < 1) {
			this._scale = Math.min(this._scale + this.timestep() * 10, 1);
			this.scale(this._scale);
		}
	}

	private scale(scale : number) : void {
		this._scale = scale;
		this.mesh().scale.copy(new THREE.Vector3(scale, scale, scale));
	}
}

