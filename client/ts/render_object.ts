import * as THREE from 'three';

import { Message } from './message.js'
import { RenderMesh } from './render_mesh.js'
import { SpacedId } from './spaced_id.js'

import { renderer } from './renderer.js'

export class RenderObject extends RenderMesh {
	private _space : number;
	private _id : number;
	private _msg : Message;
	private _initialized : boolean;
	private _initializeTime : number;

	private _timestep : number;
	private _lastUpdate : number;
	private _wasmLastSeqNum : number;

	constructor(space : number, id : number) {
		super();

		this._space = space;
		this._id = id;
		this._msg = new Message();
		this._initialized = false;
		this._timestep = 0;
		this._lastUpdate = Date.now();
		this._wasmLastSeqNum = 0;
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

	space() : number { return this._space; }
	id() : number { return this._id; }
	msg() : Message { return this._msg; }
	data() : { [k: string]: any } { return this._msg.data(); }

	initializeTime() : number { return this._initializeTime; }
	timestep() : number { return this._timestep; }
	ready() : boolean { return this._msg.has(posProp) && this._msg.has(dimProp); }
	initialized() : boolean { return this._initialized; }
	deleted() : boolean { return this._msg.has(deletedProp) && this._msg.get(deletedProp); }

	initialize() : void {
		if (this.initialized()) {
			console.error("Double initialization of object " + new SpacedId(this.space(), this.id()).toString())
			return;
		}

		wasmAdd(this.space(), this.id(), this.data());
		this._wasmLastSeqNum = this.msg().lastSeqNum();
		this._initialized = true;
		this._initializeTime = Date.now();
	}

	setData(msg : { [k: string]: any }, seqNum? : number) : void {
		this._msg.setData(msg, seqNum);
	}

	snapshotWasm() : void {
		if (this.msg().lastSeqNum() > this._wasmLastSeqNum) {
			wasmSetData(this.space(), this.id(), this.data());
			this._wasmLastSeqNum = this.msg().lastSeqNum();
		}
	}

	update() : void {
		if (!this.hasMesh() || !this.hasPos()) {
			return;
		}

		let mesh = this.mesh();
		const pos = this.pos3();
		mesh.position.x = pos.x;
		mesh.position.y = pos.y;

		if (this.hasPosZ()) {
			mesh.position.z = pos.z;
		}

		this._timestep = (Date.now() - this._lastUpdate) / 1000;
		this._lastUpdate = Date.now();
	}

	delete() : void {
		wasmDelete(this.space(), this.id());
	}

	hasAttributes() : boolean { return this._msg.has(attributesProp); }
	attributes() : Map<number, number> {
		if (this.hasAttributes()) {
			return this._msg.get(attributesProp);
		}
		return new Map<number, number>();
	}
	hasAttribute(attribute : number) : boolean { return this.hasAttributes() && this.attributes().has(attribute); }
	attribute(attribute : number) : boolean {
		if (this.hasAttribute(attribute)) {
			return this.attributes().get(attribute) === 1;
		}
		return false;
	}

	hasByteAttributes() : boolean { return this._msg.has(byteAttributesProp); }
	byteAttributes() : Map<number, number> {
		if (this.hasByteAttributes()) {
			return this._msg.get(byteAttributesProp);
		}
		return new Map<number, number>();
	}
	hasByteAttribute(attribute : number) : boolean { return this.hasByteAttributes() && this.byteAttributes().has(attribute); }
	byteAttribute(attribute : number) : number {
		if (this.hasByteAttribute(attribute)) {
			return this.byteAttributes().get(attribute);
		}
		return 0;
	}

	hasColor() : boolean { return this._msg.has(colorProp); }
	color() : number {
		if (this.hasColor()) {
			return this._msg.get(colorProp);
		}
		return 0;
	}

	hasName() : boolean { return this._msg.has(nameProp); }
	name() : string {
		if (this.hasName()) {
			return this._msg.get(nameProp);
		}
		return "";
	}

	hasThickness() : boolean { return this._msg.has(thicknessProp); }
	thickness() : number {
		if (this.hasThickness()) {
			return this._msg.get(thicknessProp);
		}
		return 0;
	}

	hasDimZ() : boolean { return this._msg.has(dimZProp); }
	dimZ() : number {
		if (this.hasDimZ()) {
			return this._msg.get(dimZProp);
		}
		return 0;
	}

	hasPosZ() : boolean { return this._msg.has(posZProp); }
	posZ() : number {
		if (this.hasPosZ()) {
			return this._msg.get(posZProp);
		}
		return 0;
	}

	hasDim() : boolean { return this._msg.has(dimProp); }
	dim() : THREE.Vector2 {
		if (this.hasDim()) {
			return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
		}
		return new THREE.Vector2();
	}
	dim3() : THREE.Vector3 {
		if (this.hasDim()) {
			return new THREE.Vector3(this._msg.get(dimProp).X, this._msg.get(dimProp).Y, this.dimZ());
		}
		return new THREE.Vector3();
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
			return new THREE.Vector3(this._msg.get(posProp).X, this._msg.get(posProp).Y, this.posZ());
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
}