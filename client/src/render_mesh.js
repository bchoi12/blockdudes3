import * as THREE from 'three';
export class RenderMesh {
    constructor() {
        this._debugMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
        this._hasMesh = false;
        this._onMeshLoad = new Array();
        this._hasParent = false;
    }
    mesh() {
        return this._mesh;
    }
    hasMesh() {
        return this._hasMesh;
    }
    setMesh(mesh) {
        this._mesh = mesh;
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
