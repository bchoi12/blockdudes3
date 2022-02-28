import * as THREE from 'three';
import { renderer } from './renderer.js';
export class RenderMesh {
    constructor() {
        this._debugMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
        this._msg = new Map();
        this._hasMesh = false;
        this._onMeshLoad = new Array();
        this._hasParent = false;
    }
    update(msg) {
        this._msg = msg;
    }
    msg() {
        return this._msg;
    }
    hasPos() {
        return this._msg.hasOwnProperty(posProp);
    }
    pos() {
        if (this.hasPos()) {
            return new THREE.Vector2(this._msg[posProp].X, this._msg[posProp].Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasVel() {
        return this._msg.hasOwnProperty(velProp);
    }
    vel() {
        if (this.hasVel()) {
            return new THREE.Vector2(this._msg[velProp].X, this._msg[velProp].Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasAcc() {
        return this._msg.hasOwnProperty(accProp);
    }
    acc() {
        if (this.hasAcc()) {
            return new THREE.Vector2(this._msg[accProp].X, this._msg[accProp].Y);
        }
        return new THREE.Vector2(0, 0);
    }
    hasDir() {
        return this._msg.hasOwnProperty(dirProp);
    }
    dir() {
        if (this.hasDir()) {
            return new THREE.Vector2(this._msg[dirProp].X, this._msg[dirProp].Y);
        }
        return new THREE.Vector2(1, 0);
    }
    hasWeaponDir() {
        return this._msg.hasOwnProperty(weaponDirProp);
    }
    weaponDir() {
        if (this.hasWeaponDir()) {
            return new THREE.Vector2(this._msg[weaponDirProp].X, this._msg[weaponDirProp].Y);
        }
        return new THREE.Vector2(1, 0);
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
