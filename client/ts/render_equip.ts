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
		if (state === 2) {
			if (Date.now() - this._lastSmoke >= this._smokeInterval) {
				[-1, 1].forEach((i : number) => {
					let local = this.mesh().position.clone();
					let emit = this._emit.clone();
					emit.x *= i;

					// TODO: not sure why this is better at 0
					emit.z = 0;
					local.add(emit);
					let pos = this.mesh().localToWorld(local);
					game.particles().emit(Particle.FINE_SMOKE, 500, (mesh : THREE.Object3D, ts : number) => {
						mesh.scale.multiplyScalar(0.95);
						mesh.position.y -= 10 * mesh.scale.x * ts;
					}, {
						position: pos,
						scale: MathUtil.randomRange(0.1, 0.15),
					});
				});
				this._lastSmoke = Date.now();
			}

			if (Util.defined(this._fire)) {
				this._fire.visible = true;
				this._fire.scale.y = MathUtil.randomRange(2.5, 4);
			}
		} else {
			if (Util.defined(this._fire)) {
				this._fire.visible = false;
			}
		}
	}

	private loadMesh() : void {
		if (this._equipType === jetpackEquip) {
			loader.load(Model.JETPACK, (mesh : THREE.Mesh) => {
				this._emit = mesh.getObjectByName("emit").position.clone();
				this._fire = mesh.getObjectByName("fire");
				this.setMesh(mesh);
				this._player.removeEquip();
				this._player.setEquip(this);
			});
		} else {
			this._player.removeEquip();
		}
	}
}