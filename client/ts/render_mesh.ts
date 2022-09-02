import * as THREE from 'three';

import { renderer } from './renderer.js'
import { SpacedId } from './spaced_id.js'

export class RenderMesh {
	protected _mesh : THREE.Object3D;
	protected _hasMesh : boolean
	protected _onMeshLoad : Array<() => void>;

	protected _parent : RenderMesh;
	protected _hasParent : boolean;

	constructor() {
		this._hasMesh = false;
		this._onMeshLoad = new Array<() => void>();

		this._hasParent = false;
	}

	mesh() : THREE.Object3D {
		return this._mesh;
	}

	hasMesh() : boolean {
		return this._hasMesh;
	}

	setMesh(mesh : THREE.Object3D) : void {
		this._mesh = mesh;
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
}