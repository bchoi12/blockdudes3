import * as THREE from 'three';

import { Message } from './message.js'
import { RenderMesh } from './render_mesh.js'
import { SpacedId } from './spaced_id.js'

import { renderer } from './renderer.js'

export class RenderObject extends RenderMesh {
	protected _space : number;
	protected _id : number;
	protected _msg : Message;
	protected _initialized : boolean;
	
	constructor(space : number, id : number) {
		super();

		this._space = space;
		this._id = id;
		this._msg = new Message();
		this._initialized = false;
	}

	override setMesh(mesh : THREE.Mesh) : void {
		super.setMesh(mesh);

		if (this.hasPos()) {
			const pos = this.pos();
			mesh.position.x = pos.x;
			mesh.position.y = pos.y;
		}
		mesh.name = new SpacedId(this._space, this._id).toString();
	}

	msg() : Message { return this._msg; }
	data() : { [k: string]: any } { return this._msg.data(); }

	space() : number { return this._space; }
	id() : number { return this._id; }

	initialize() : void {
		if (this.initialized()) {
			console.error("Double initialization of object " + new SpacedId(this.space(), this.id()).toString())
			return;
		}

		wasmAdd(this.space(), this.id(), this.data());
		this._initialized = true;
	}

	initialized() : boolean { return this._initialized; }
	ready() : boolean { return this._msg.has(posProp) && this._msg.has(dimProp); }

	update(msg : Map<number, any>, seqNum? : number) : void {
		this._msg.update(msg, seqNum);

		if (!this.hasMesh() || !this.hasPos()) {
			return;
		}

		// TODO: delete after making classes for walls/platforms
		const mesh = this.mesh();
		const pos = this.pos();
		mesh.position.x = pos.x;
		mesh.position.y = pos.y;
	}

	deleted() : boolean {
		return this._msg.has(deletedProp) && this._msg.get(deletedProp);
	}

	hasDim() : boolean { return this._msg.has(dimProp); }
	dim() : THREE.Vector2 {
		if (this.hasDim()) {
			return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasPos() : boolean { return this._msg.has(posProp); }
	pos() : THREE.Vector2 {
		if (this.hasPos()) {
			return new THREE.Vector2(this._msg.get(posProp).X, this._msg.get(posProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasVel() : boolean { return this._msg.has(velProp); }
	vel() : THREE.Vector2 {
		if (this.hasVel()) {
			return new THREE.Vector2(this._msg.get(velProp).X, this._msg.get(velProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasAcc() : boolean { return this._msg.has(accProp); }
	acc() : THREE.Vector2 {
		if (this.hasAcc()) {
			return new THREE.Vector2(this._msg.get(accProp).X, this._msg.get(accProp).Y);
		}
		return new THREE.Vector2(0, 0);
	}

	hasDir() : boolean { return this._msg.has(dirProp); }
	dir() : THREE.Vector2 {
		if (this.hasDir()) {
			return new THREE.Vector2(this._msg.get(dirProp).X, this._msg.get(dirProp).Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasWeaponType() : boolean { return this._msg.has(equipTypeProp); }
	weaponType() : number {
		if (this.hasWeaponType()) {
			return this._msg.get(equipTypeProp);
		}
		return 0;
	}

	hasWeaponDir() : boolean { return this._msg.has(equipDirProp); }
	weaponDir() : THREE.Vector2 {
		if (this.hasWeaponDir()) {
			return new THREE.Vector2(this._msg.get(equipDirProp).X, this._msg.get(equipDirProp).Y);
		}
		return new THREE.Vector2(1, 0);
	}

	hasGrounded() : boolean { return this._msg.has(groundedProp); }
	grounded() : boolean {
		if (this.hasGrounded()) {
			return this._msg.get(groundedProp);
		}
		return true;
	}

	hasOwner() : boolean { return this._msg.has(ownerProp); }
	owner() : SpacedId {
		if (this.hasOwner()) {
			return new SpacedId(this._msg.get(ownerProp).S, this._msg.get(ownerProp).Id);
		}
		return new SpacedId(0, -1);
	}
}