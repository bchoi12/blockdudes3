import * as THREE from 'three';

import { game } from './game.js'
import { loader, Model } from './loader.js'
import { Particle } from './particles.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { MathUtil, Util } from './util.js'

export class RenderEquip extends RenderObject {
	private readonly _smokeInterval = 30;

	private _equipType : number;
	private _lastSmoke : number;

	private _player : RenderPlayer;
	private _emit : THREE.Object3D;
	private _fire : THREE.Object3D;

	constructor(space : number, id : number) {
		super(space, id);

		this._equipType = 0;
		this._lastSmoke = 0;
		this.disableAutoUpdatePos();
	}

	override ready() : boolean {
		return this.hasOwner();
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		this._player = game.sceneMap().getAsAny(owner.space(), owner.id());
		if (!Util.defined(this._player)) {
			return;
		}

		this._equipType = this.byteAttribute(subtypeByteAttribute);
		this.loadMesh();
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		if (!Util.defined(this._player)) {
			return;
		}

		if (this._equipType !== this.byteAttribute(subtypeByteAttribute)) {
			this._equipType = this.byteAttribute(subtypeByteAttribute);
			this.loadMesh();
		}

		const state = this.byteAttribute(stateByteAttribute);
		if (this._equipType === jetpackEquip) {
			this.updateJetpack(state);
		} else if (this._equipType === boosterEquip) {
			this.updateBooster(state);
		}
	}

	private loadMesh() : void {
		this._player.removeEquip();
		if (this._equipType === jetpackEquip) {
			loader.load(Model.JETPACK, (mesh : THREE.Mesh) => {
				this._emit = mesh.getObjectByName("emit");
				this._fire = mesh.getObjectByName("fire");
				this.setMesh(mesh);
				this._player.removeEquip();
				this._player.setEquip(this);
			});
		} else if (this._equipType === boosterEquip) {
			loader.load(Model.HEADBAND, (mesh: THREE.Mesh) => {
				this.setMesh(mesh);
				this._player.setEquip(this);
			});
		} else if (this._equipType === chargerEquip) {
			loader.load(Model.SCOUTER, (mesh : THREE.Mesh) => {
				this.setMesh(mesh);
				this._player.setEquip(this);
			});
		}
	}

	private updateJetpack(state : number) : void {
		if (state === activePartState) {
			if (Date.now() - this._lastSmoke >= this._smokeInterval) {
				let pos = this.mesh().localToWorld(this._emit.position.clone());
				pos.x += MathUtil.randomRange(-0.05, 0.05);
				pos.z += MathUtil.randomRange(-0.1, 0.1);
				game.particles().emit(Particle.FINE_SMOKE, 500, (mesh : THREE.Object3D, ts : number) => {
					mesh.scale.multiplyScalar(0.95);
					mesh.position.y -= 10 * mesh.scale.x * ts;
				}, {
					position: pos,
					scale: MathUtil.randomRange(0.1, 0.2),
				});
				this._lastSmoke = Date.now();
			}

			if (Util.defined(this._fire)) {
				this._fire.visible = true;
				this._fire.scale.y = MathUtil.randomRange(1, 5);
			}
		} else {
			if (Util.defined(this._fire)) {
				this._fire.visible = false;
			}
		}
	}

	private updateBooster(state : number) : void {
		// TODO: need triggers to make this better
		/*
		if (state === activePartState) {
			game.particles().emit(Particle.LINES, 125, (object : THREE.InstancedMesh, ts : number) => {
				object.position.copy(this._player.pos3());

				for (let i = 0; i < object.count; ++i) {
					let matrix = new THREE.Matrix4();
					object.getMatrixAt(i, matrix);

					let pos = new THREE.Vector3();
					let rotation = new THREE.Quaternion();
					let scale = new THREE.Vector3();
					matrix.decompose(pos, rotation, scale);

					rotation.z += MathUtil.randomRange(-0.1, 0.1);
					scale.x *= 0.9;

					matrix.compose(pos, rotation, scale);
					object.setMatrixAt(i, matrix);
				}

				if (object.instanceMatrix) {
					object.instanceMatrix.needsUpdate = true;
				}
			}, {
				position: this._player.pos3(),
				rotation: new THREE.Euler(0, 0, this._player.dir().angle()),
				scale: 1,
				instances: {
					posFn: (object, i) => {
						let pos = new THREE.Vector3(MathUtil.randomRange(-0.1, 0.1), MathUtil.randomRange(-0.8, 0.8), object.position.z);
						let dir = new THREE.Vector3(1, 0, 0);
						dir.applyEuler(0, 0, this._player.dir().angle());
						dir.multiplyScalar();
				pos = dir;
						return pos;
					},
					scaleFn: (object, i) => {
						return new THREE.Vector3(1.5 + MathUtil.randomRange(0, 1), 0.04, 0);
					},
					colorFn: (object, i) => {
						const color = MathUtil.randomRange(0, 1);
						return new THREE.Color(color, color, color);
					}
				},
			});
		}
		*/
	}
}