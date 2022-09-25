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
		return this.hasOwner() && this.hasByteAttribute(subtypeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		console.log("init equip");

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

		if (!Util.defined(this._player)) {
			return;
		}

		if (this._equipType !== this.byteAttribute(subtypeByteAttribute)) {
			this._equipType = this.byteAttribute(subtypeByteAttribute);
			this.loadMesh();
		}

		if (!this.hasMesh()) {
			return;
		}

		const state = this.byteAttribute(stateByteAttribute);
		if (this._equipType === jetpackEquip) {
			this.updateJetpack(state);
		} else if (this._equipType === boosterEquip) {
			this.updateBooster(state);
		}
	}

	private loadMesh() : void {
		if (this._equipType === jetpackEquip) {
			loader.load(Model.JETPACK, (mesh : THREE.Mesh) => {
				this._emit = mesh.getObjectByName("emit");
				this._fire = mesh.getObjectByName("fire");

				if (this.hasMesh() && this.mesh().parent) {
					this.mesh().parent.remove(this.mesh());
				}
				this.setMesh(mesh);
				this._player.setEquip(this);
			});
		} else if (this._equipType === boosterEquip) {
			loader.load(Model.HEADBAND, (mesh: THREE.Mesh) => {
				if (this.hasMesh() && this.mesh().parent) {
					this.mesh().parent.remove(this.mesh());
				}
				this.setMesh(mesh);
				this._player.setEquip(this);

			});
		} else if (this._equipType === chargerEquip) {
			loader.load(Model.SCOUTER, (mesh : THREE.Mesh) => {
				if (this.hasMesh() && this.mesh().parent) {
					this.mesh().parent.remove(this.mesh());
				}
				this.setMesh(mesh);
				this._player.setEquip(this);
			});
		} else {
			if (this.hasMesh() && this.mesh().parent) {
				this.mesh().parent.remove(this.mesh());
			}
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
			const weapon = this._player.weapon();

			if (!Util.defined(weapon)) {
				return;
			}

			// TODO: fix weapon dir and use it here
			const angle = this._player.dir().angle();
			let offset = new THREE.Vector3(-1, 0, 0);
			offset.applyEuler(new THREE.Euler(0, 0, angle));

			let pos = this._player.pos3();
			pos.add(offset.clone().multiplyScalar(0.5));

			game.particles().emit(Particle.SMOKE_RING, 400, (object : THREE.Mesh, ts : number) => {
				object.scale.multiplyScalar(0.95);
				object.position.add(offset.clone().multiplyScalar(20 * object.scale.x * ts));
			}, {
				position: pos,
				scale: 0.4,
				rotation: new THREE.Euler(0, Math.PI / 2 + Math.sign(this._player.weapon().dir().x) * 0.2, Math.PI / 2),
			});
		}
		*/
	}
}