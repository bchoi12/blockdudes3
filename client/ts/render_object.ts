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

	override setMesh(mesh : THREE.Object3D) : void {
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
	newData() : { [k: string]: any } { return this._msg.newData(); }

	space() : number { return this._space; }
	id() : number { return this._id; }

	initialize() : void {
		if (this.initialized()) {
			console.error("Double initialization of object " + new SpacedId(this.space(), this.id()).toString())
			return;
		}

		this.maybeUpdateMeshPosition();
		wasmAdd(this.space(), this.id(), this.data());
		this._initialized = true;
	}

	initialized() : boolean { return this._initialized; }
	ready() : boolean { return this._msg.has(posProp) && this._msg.has(dimProp); }

	update(msg : { [k: string]: any }, seqNum? : number) : void {
		this._msg.update(msg, seqNum);
		this.maybeUpdateMeshPosition();
	}

	deleted() : boolean {
		return this._msg.has(deletedProp) && this._msg.get(deletedProp);
	}

	hasAttributes() : boolean { return this._msg.has(attributesProp); }
	attributes() : Map<number, boolean> {
		if (this.hasAttributes()) {
			return this._msg.get(attributesProp);
		}
		return new Map<number, boolean>();
	}
	hasAttribute(attribute : number) : boolean { return this.hasAttributes() && this.attributes().has(attribute); }
	attribute(attribute : number) : boolean {
		if (this.hasAttribute(attribute)) {
			return this.attributes().get(attribute);
		}
		return false;
	}

	hasDim() : boolean { return this._msg.has(dimProp); }
	dim() : THREE.Vector2 {
		if (this.hasDim()) {
			return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
		}
		return new THREE.Vector2();
	}

	hasPos() : boolean { return this._msg.has(posProp); }
	pos() : THREE.Vector2 {
		if (this.hasPos()) {
			return new THREE.Vector2(this._msg.get(posProp).X, this._msg.get(posProp).Y);
		}
		return new THREE.Vector2();
	}
	pos3() : THREE.Vector3 {
		if (this.hasPos()) {
			return new THREE.Vector3(this._msg.get(posProp).X, this._msg.get(posProp).Y, this.hasMesh() ? this.mesh().position.z : 0);
		}
		return new THREE.Vector3();
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

	hasOwner() : boolean { return this._msg.has(ownerProp); }
	owner() : SpacedId {
		if (this.hasOwner()) {
			return new SpacedId(this._msg.get(ownerProp).S, this._msg.get(ownerProp).Id);
		}
		return new SpacedId(0, -1);
	}

	hasKills() : boolean { return this._msg.has(killProp); }
	kills() : number {
		if (this.hasKills()) {
			return this._msg.get(killProp);
		}
		return 0;
	}

	hasDeaths() : boolean { return this._msg.has(deathProp); }
	deaths() : number {
		if (this.hasDeaths()) {
			return this._msg.get(deathProp);
		}
		return 0;
	}

	private maybeUpdateMeshPosition() {
		if (!this.hasMesh() || !this.hasPos()) {
			return;
		}

		let mesh = this.mesh();
		const pos = this.pos();
		mesh.position.x = pos.x;
		mesh.position.y = pos.y;
	}
}