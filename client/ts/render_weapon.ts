import * as THREE from 'three';
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

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
		return super.ready() && this.hasOwner() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		this._weaponType = this.byteAttribute(typeByteAttribute);
		this.loadMesh();
	}

	override delete() : void {
		super.delete();

		game.sceneMap().returnPointLight(this._chargeLight);
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
				this._chargeLight.intensity = 16;
				this._chargeLight.distance = 0.4;
			} else if (this.attribute(chargingAttribute)) {
				if (this._chargingCount > 5) {
					this._chargeLight.intensity += 16 * this.timestep();
					this._chargeLight.distance += 0.4 * this.timestep();

					if (this._chargeLight.intensity > 16) {
						this._chargeLight.intensity = 16;
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
			this.mesh().rotation.z = this.dir().angle();
		}
	}

	weaponType() : number {
		return this.byteAttribute(typeByteAttribute);
	}

	private tryInitLight() : void {
		if (!this.hasMesh()) {
			return;
		}

		if (!Util.defined(this._chargeLight)) {
			this._chargeLight = game.sceneMap().getPointLight();
			this._chargeLight.color = new THREE.Color(0x47def5);
		}
		if (Util.defined(this._chargeLight)) {
			this._chargeLight.position.copy(this._shotOrigin);
			this.mesh().add(this._chargeLight);
		}
	}

	private loadMesh() {
		if (this.weaponType() === 0) {
			if (Util.defined(this._player)) {
				this._player.removeWeaponMesh();
			}
			return;
		}

		loader.load(loader.getWeaponModel(this.weaponType()), (mesh : THREE.Mesh) => {
			if (Util.defined(this._player)) {
				this._player.removeWeaponMesh();
			}
			this.setMesh(mesh);
		});
	}
}