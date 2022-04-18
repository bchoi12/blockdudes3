import * as THREE from 'three';
import { Message } from './message.js';
import { RenderMesh } from './render_mesh.js';
import { SpacedId } from './spaced_id.js';
export class RenderObject extends RenderMesh {
    constructor(space, id) {
        super();
        this._space = space;
        this._id = id;
        this._msg = new Message();
        this._initialized = false;
    }
    setMesh(mesh) {
        super.setMesh(mesh);
        if (this.hasPos()) {
            const pos = this.pos();
            mesh.position.x = pos.x;
            mesh.position.y = pos.y;
        }
        mesh.name = new SpacedId(this._space, this._id).toString();
    }
    msg() { return this._msg; }
    data() { return this._msg.data(); }
    space() { return this._space; }
    id() { return this._id; }
    initialize() { this._initialized = true; }
    initialized() { return this._initialized; }
    ready() { return this._msg.has(posProp) && this._msg.has(dimProp); }
    update(msg, seqNum) {
        this._msg.update(msg, seqNum);
        if (!this.hasMesh() || !this.hasPos()) {
            return;
        }
        const mesh = this.mesh();
        const pos = this.pos();
        mesh.position.x = pos.x;
        mesh.position.y = pos.y;
    }
    deleted() {
        return this._msg.has(deletedProp) && this._msg.get(deletedProp);
    }
    hasDim() { return this._msg.has(dimProp); }
    dim() {
        if (this.hasDim()) {
            return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasPos() { return this._msg.has(posProp); }
    pos() {
        if (this.hasPos()) {
            return new THREE.Vector2(this._msg.get(posProp).X, this._msg.get(posProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasVel() { return this._msg.has(velProp); }
    vel() {
        if (this.hasVel()) {
            return new THREE.Vector2(this._msg.get(velProp).X, this._msg.get(velProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasAcc() { return this._msg.has(accProp); }
    acc() {
        if (this.hasAcc()) {
            return new THREE.Vector2(this._msg.get(accProp).X, this._msg.get(accProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasDir() { return this._msg.has(dirProp); }
    dir() {
        if (this.hasDir()) {
            return new THREE.Vector2(this._msg.get(dirProp).X, this._msg.get(dirProp).Y);
        }
        return new THREE.Vector2(1, 0);
    }
    hasWeaponDir() { return this._msg.has(weaponDirProp); }
    weaponDir() {
        if (this.hasWeaponDir()) {
            return new THREE.Vector2(this._msg.get(weaponDirProp).X, this._msg.get(weaponDirProp).Y);
        }
        return new THREE.Vector2(1, 0);
    }
    hasGrounded() { return this._msg.has(groundedProp); }
    grounded() {
        if (this.hasGrounded()) {
            return this._msg.get(groundedProp);
        }
        return true;
    }
    hasOwner() { return this._msg.has(ownerProp); }
    owner() {
        if (this.hasOwner()) {
            return new SpacedId(this._msg.get(ownerProp).S, this._msg.get(ownerProp).Id);
        }
        return new SpacedId(0, -1);
    }
}
