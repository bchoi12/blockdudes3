import * as THREE from 'three';
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { Util } from './util.js'

export class RenderWeapon extends RenderObject {

	private _weaponType : number;

	private _player : RenderPlayer;
	private _attached : boolean;

	constructor(space : number, id : number) {
		super(space, id);

		this._weaponType = 0;
		this._player = null;
		this._attached = false;
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		this._weaponType = this.byteAttribute(typeByteAttribute);
		this.loadMesh();
	}

	override setMesh(mesh : THREE.Object3D) : void {
		super.setMesh(mesh);

		if (this.owner().space() === playerSpace) {
			this._player = game.sceneMap().getAsAny(playerSpace, this.owner().id());
			this._player.setWeapon(this);
			this._attached = true;
		} else {
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

		if (this._attached) {
			this.mesh().position.copy(new THREE.Vector3(0, 0, 0));
		} else {
			this.mesh().rotation.z = this.dir().angle();
		}
	}

	weaponType() : number {
		return this.byteAttribute(typeByteAttribute);
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