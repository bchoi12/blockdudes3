import * as THREE from 'three';

import { Message } from './message.js'
import { SpacedId } from './spaced_id.js'

import { renderer } from './renderer.js'

export class RenderMesh {
	protected readonly _debugMaterial = new THREE.MeshStandardMaterial({color: 0xff0000, wireframe: true });

	protected _msg : Message;

	protected _mesh : THREE.Mesh;
	protected _hasMesh : boolean
	protected _onMeshLoad : Array<() => void>;

	protected _parent : RenderMesh;
	protected _hasParent : boolean;

	constructor() {
		this._msg = new Message();

		this._hasMesh = false;
		this._onMeshLoad = new Array<() => void>();

		this._hasParent = false;
	}

	msg() : Message {
		return this._msg;
	}

	data() : { [k: string]: any } {
		return this._msg.data();
	}

	update(msg : Map<number, any>, seqNum? : number) : void {
		this._msg.update(msg, seqNum);
	}

	deleted() : boolean {
		return this._msg.has(deletedProp) && this._msg.get(deletedProp);
	}

	hasDim() : boolean {
		return this._msg.has(dimProp);
	}
	dim() : THREE.Vector2 {
		if (this.hasDim()) {
			return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasPos() : boolean {
		return this._msg.has(posProp);
	}
	pos() : THREE.Vector2 {
		if (this.hasPos()) {
			return new THREE.Vector2(this._msg.get(posProp).X, this._msg.get(posProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasVel() : boolean {
		return this._msg.has(velProp);
	}
	vel() : THREE.Vector2 {
		if (this.hasVel()) {
			return new THREE.Vector2(this._msg.get(velProp).X, this._msg.get(velProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasAcc() : boolean {
		return this._msg.has(accProp);
	}
	acc() : THREE.Vector2 {
		if (this.hasAcc()) {
			return new THREE.Vector2(this._msg.get(accProp).X, this._msg.get(accProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasDir() : boolean {
		return this._msg.has(dirProp);
	}
	dir() : THREE.Vector2 {
		if (this.hasDir()) {
			return new THREE.Vector2(this._msg.get(dirProp).X, this._msg.get(dirProp).Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasWeaponDir() : boolean {
		return this._msg.has(weaponDirProp);
	}
	weaponDir() : THREE.Vector2 {
		if (this.hasWeaponDir()) {
			return new THREE.Vector2(this._msg.get(weaponDirProp).X, this._msg.get(weaponDirProp).Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasGrounded() : boolean {
		return this._msg.has(groundedProp);
	}
	grounded() : boolean {
		if (this.hasGrounded()) {
			return this._msg.get(groundedProp);
		}
		return true;
	}

	hasOwner() : boolean {
		return this._msg.has(ownerProp);
	}
	owner() : SpacedId {
		if (this.hasOwner()) {
			return new SpacedId(this._msg.get(ownerProp).S, this._msg.get(ownerProp).Id);
		}
		return new SpacedId(0, -1);
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