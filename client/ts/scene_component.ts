import * as THREE from 'three';

export abstract class SceneComponent {
	protected _scene : THREE.Scene;

	constructor() {
		this._scene = new THREE.Scene();
	}

	scene() : THREE.Scene {
		return this._scene;
	}

	abstract update(position : THREE.Vector3) : void
}