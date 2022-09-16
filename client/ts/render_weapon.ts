import * as THREE from 'three';

import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { Particle } from './particles.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

export class RenderWeapon extends RenderObject {

	private readonly _shotLocation = "shoot";

	private _weaponType : number;

	private _shotOrigin : THREE.Vector3;
	private _player : RenderPlayer;
	private _attached : boolean;

	private _chargingCount : number;
	private _chargeLight : THREE.PointLight;
	private _lightSphere : THREE.Mesh;

	constructor(space : number, id : number) {
		super(space, id);

		this._weaponType = 0;
		this._player = null;
		this._attached = false;

		this._chargingCount = 0;
	}

	override ready() : boolean {
		return this.hasDir() && this.hasOwner() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		this._weaponType = this.byteAttribute(typeByteAttribute);
		this.loadMesh();
	}

	override delete() : void {
		super.delete();

		game.sceneMap().returnPointLight(this._chargeLight);
		this._chargeLight = null;
	}

	override setMesh(mesh : THREE.Object3D) : void {
		super.setMesh(mesh);

		this._shotOrigin = this.mesh().getObjectByName(this._shotLocation).position.clone();
		this._attached = false;

		if (this.owner().space() !== playerSpace) {
			let weaponMesh = this.mesh().getObjectByName("mesh");
			weaponMesh.rotation.y = Math.PI / 2;
		}
	}

	override update() : void {
		super.update();

		if (this._weaponType !== this.byteAttribute(typeByteAttribute)) {
			this._weaponType = this.byteAttribute(typeByteAttribute);
			this.loadMesh();
		}

		if (!this.hasMesh()) {
			return;
		}

		if (!this._attached) {
			this._player = game.sceneMap().getAsAny(playerSpace, this.owner().id());
			
			if (Util.defined(this._player)) {
				this._player.setWeapon(this);
				this._attached = true;			
			}
		}

		if (!Util.defined(this._chargeLight)) {
			if (this.attribute(chargingAttribute) || this.attribute(chargedAttribute)) {
				this.tryInitLight();
			}
		} else {
			if (this.attribute(chargedAttribute)) {
				this._chargingCount = 0;
				this._chargeLight.intensity = 6;
				this._chargeLight.distance = 1;
			} else if (this.attribute(chargingAttribute)) {
				if (this._chargingCount > 5) {
					this._chargeLight.intensity += 6 * this.timestep();
					this._chargeLight.distance += 0.4 * this.timestep();

					if (this._chargeLight.intensity > 6) {
						this._chargeLight.intensity = 6;
					}
					if (this._chargeLight.distance > 0.4) {
						this._chargeLight.distance = 0.4;
					}
				} else {
					this._chargingCount++;
					this._chargeLight.intensity = 0;
					this._chargeLight.distance = 0;
				}
			} else {
				this._chargingCount = 0;
				this._chargeLight.intensity = 0;
				this._chargeLight.distance = 0;
			}
		}

		if (this._attached) {
			this.mesh().position.copy(new THREE.Vector3(0, 0, 0));
		} else {
			// NOTE: dir is always (1, 0) in WASM since key updates are not propagated correctly
			this.mesh().rotation.z = this.dir().angle();
		}
	}

	shotOrigin() : THREE.Vector3 { return this._shotOrigin; }
	weaponType() : number { return this.byteAttribute(typeByteAttribute); }

	private tryInitLight() : void {
		if (!this.hasMesh() || Util.defined(this._chargeLight)) {
			return;
		}

		this._chargeLight = game.sceneMap().getPointLight({
			position: this._shotOrigin,
			color: new THREE.Color(0x47def5),
			intensity: 0,
			distance: 0,
			attach: this.mesh(),
		});
	}

	private loadMesh() {
		if (this.weaponType() === 0) {
			return;
		}

		loader.load(loader.getWeaponModel(this.weaponType()), (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}
}