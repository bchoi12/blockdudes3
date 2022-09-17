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
	private _emit : THREE.Vector3;

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
		if (state === 2) {
			let local = this.mesh().position.clone();

			console.log(this._emit);
			if (Math.random() < 0.5) {
				this._emit.x = -this._emit.x;
				this._emit.z = -this._emit.z;
			}
			local.add(this._emit);
			let pos = this.mesh().localToWorld(local);
			pos.x += MathUtil.randomRange(-0.05, 0.05);
			if (Date.now() - this._lastSmoke >= this._smokeInterval) {
				game.particles().emit(Particle.FINE_SMOKE, 600, (mesh : THREE.Object3D, ts : number) => {
					mesh.scale.multiplyScalar(0.95);
					mesh.position.y -= 10 * mesh.scale.x * ts;
				}, {
					position: pos,
					scale: 0.2,
				});
				this._lastSmoke = Date.now();
			}
		}
	}

	private loadMesh() : void {
		if (this._equipType === jetpackEquip) {
			loader.load(Model.JETPACK, (mesh : THREE.Mesh) => {
				this._emit = mesh.getObjectByName("emit").position.clone();
				this.setMesh(mesh);
				this._player.removeEquip();
				this._player.setEquip(this);
			});
		} else {
			this._player.removeEquip();
		}
	}
}