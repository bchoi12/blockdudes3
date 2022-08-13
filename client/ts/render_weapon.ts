import * as THREE from 'three';
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { Util } from './util.js'

export class RenderWeapon extends RenderObject {

	private _player : RenderPlayer;
	private _attached : boolean;

	constructor(space : number, id : number) {
		super(space, id);

		this._attached = false;
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		loader.load(loader.getWeaponModel(this.weaponType()), (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
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
}