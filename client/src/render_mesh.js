import * as THREE from 'three';
import { Message } from './message.js';
import { SpacedId } from './spaced_id.js';
import { renderer } from './renderer.js';
export class RenderMesh {
    constructor() {
        this._debugMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
        this._msg = new Message();
        this._hasMesh = false;
        this._onMeshLoad = new Array();
        this._hasParent = false;
    }
    msg() {
        return this._msg;
    }
    data() {
        return this._msg.data();
    }
    update(msg, seqNum) {
        this._msg.update(msg, seqNum);
    }
    deleted() {
        return this._msg.has(deletedProp) && this._msg.get(deletedProp);
    }
    hasDim() {
        return this._msg.has(dimProp);
    }
    dim() {
        if (this.hasDim()) {
            return new THREE.Vector2(this._msg.get(dimProp).X, this._msg.get(dimProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasPos() {
        return this._msg.has(posProp);
    }
    pos() {
        if (this.hasPos()) {
            return new THREE.Vector2(this._msg.get(posProp).X, this._msg.get(posProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasVel() {
        return this._msg.has(velProp);
    }
    vel() {
        if (this.hasVel()) {
            return new THREE.Vector2(this._msg.get(velProp).X, this._msg.get(velProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasAcc() {
        return this._msg.has(accProp);
    }
    acc() {
        if (this.hasAcc()) {
            return new THREE.Vector2(this._msg.get(accProp).X, this._msg.get(accProp).Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasDir() {
        return this._msg.has(dirProp);
    }
    dir() {
        if (this.hasDir()) {
            return new THREE.Vector2(this._msg.get(dirProp).X, this._msg.get(dirProp).Y);
        }
        return new THREE.Vector2(1, 0);
    }
    hasWeaponDir() {
        return this._msg.has(weaponDirProp);
    }
    weaponDir() {
        if (this.hasWeaponDir()) {
            return new THREE.Vector2(this._msg.get(weaponDirProp).X, this._msg.get(weaponDirProp).Y);
        }
        return new THREE.Vector2(1, 0);
    }
    hasGrounded() {
        return this._msg.has(groundedProp);
    }
    grounded() {
        if (this.hasGrounded()) {
            return this._msg.get(groundedProp);
        }
        return true;
    }
    hasOwner() {
        return this._msg.has(ownerProp);
    }
    owner() {
        if (this.hasOwner()) {
            return new SpacedId(this._msg.get(ownerProp).S, this._msg.get(ownerProp).Id);
        }
        return new SpacedId(0, -1);
    }
    mesh() {
        return this._mesh;
    }
    hasMesh() {
        return this._hasMesh;
    }
    setMesh(mesh) {
        this._mesh = mesh;
        renderer.compile(this._mesh);
        this._onMeshLoad.forEach((cb) => {
            cb();
        });
        this._hasMesh = true;
    }
    onMeshLoad(onMeshLoad) {
        if (this._hasMesh) {
            onMeshLoad();
        }
        else {
            this._onMeshLoad.push(onMeshLoad);
        }
    }
    parent() {
        return this._parent;
    }
    hasParent() {
        return this._hasParent;
    }
    setParent(parent) {
        this._parent = parent;
    }
}
