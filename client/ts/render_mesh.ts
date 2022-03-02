import * as THREE from 'three';

import { renderer } from './renderer.js'

export class RenderMesh {
	protected readonly _debugMaterial = new THREE.MeshStandardMaterial({color: 0xff0000, wireframe: true });

	protected _msg : Map<number, any>;

	protected _mesh : THREE.Mesh;
	protected _hasMesh : boolean
	protected _onMeshLoad : Array<() => void>;

	protected _parent : RenderMesh;
	protected _hasParent : boolean;
	
	constructor() {
		this._msg = new Map<number, any>();

		this._hasMesh = false;
		this._onMeshLoad = new Array<() => void>();

		this._hasParent = false;
	}

	update(msg : Map<number, any>) : void {
		Object.assign(this._msg, msg);
	}

	msg() : Map<number, any> {
		return this._msg;
	}

	hasPos() : boolean {
		return this._msg.hasOwnProperty(posProp);
	}
	pos() : THREE.Vector2 {
		if (this.hasPos()) {
			return new THREE.Vector2(this._msg[posProp].X, this._msg[posProp].Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasDim() : boolean {
		return this._msg.hasOwnProperty(dimProp);
	}
	dim() : THREE.Vector2 {
		if (this.hasDim()) {
			return new THREE.Vector2(this._msg[dimProp].X, this._msg[dimProp].Y);
		}
		return new THREE.Vector2(0, 0);
	}


	hasEndPos() : boolean {
		return this._msg.hasOwnProperty(endPosProp);
	}
	endPos() : THREE.Vector2 {
		if (this.hasEndPos()) {
			return new THREE.Vector2(this._msg[endPosProp].X, this._msg[endPosProp].Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasVel() : boolean {
		return this._msg.hasOwnProperty(velProp);
	}
	vel() : THREE.Vector2 {
		if (this.hasVel()) {
			return new THREE.Vector2(this._msg[velProp].X, this._msg[velProp].Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasAcc() : boolean {
		return this._msg.hasOwnProperty(accProp);
	}
	acc() : THREE.Vector2 {
		if (this.hasAcc()) {
			return new THREE.Vector2(this._msg[accProp].X, this._msg[accProp].Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasDir() : boolean {
		return this._msg.hasOwnProperty(dirProp);
	}
	dir() : THREE.Vector2 {
		if (this.hasDir()) {
			return new THREE.Vector2(this._msg[dirProp].X, this._msg[dirProp].Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasWeaponDir() : boolean {
		return this._msg.hasOwnProperty(weaponDirProp);
	}
	weaponDir() : THREE.Vector2 {
		if (this.hasWeaponDir()) {
			return new THREE.Vector2(this._msg[weaponDirProp].X, this._msg[weaponDirProp].Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasGrounded() : boolean {
		return this._msg.hasOwnProperty(groundedProp);
	}
	grounded() : boolean {
		if (this.hasGrounded()) {
			return this._msg[groundedProp];
		}
		return true;
	}

	mesh() : THREE.Mesh {
		return this._mesh;
	}

	hasMesh() : boolean {
		return this._hasMesh;
	}

	setMesh(mesh : THREE.Mesh) : void {
		this._mesh = mesh;
		renderer.compile(this._mesh);

		this._onMeshLoad.forEach((cb) => {
			cb();
		});
		this._hasMesh = true;
	}

	onMeshLoad(onMeshLoad : () => void) : void {
		if (this._hasMesh) {
			onMeshLoad();
		} else {
			this._onMeshLoad.push(onMeshLoad);
		}
	}

	parent() : RenderMesh {
		return this._parent;
	}

	hasParent() : boolean {
		return this._hasParent;
	}

	setParent(parent : RenderMesh) : void {
		this._parent = parent;
	}
}