import * as THREE from 'three'

import { renderer } from './renderer.js'
import { Util } from './util.js'

export class ObjectBuffer<T extends THREE.Object3D> {
	private _objects : Set<T>;
	private _create : () => T;

	constructor(create : () => T) {
		this._objects = new Set<T>();
		this._create = create;
	}

	static applyOverrides(object : THREE.Object3D, overrides : ObjectOverrides) : THREE.Object3D {
		// @ts-ignore
		let material = object.material;
		if (overrides.color) {
			if (overrides.color instanceof THREE.Color) {
				material.color = overrides.color;
			} else if (!isNaN(overrides.color)) {
				material.color = new THREE.Color(overrides.color);
			}
		}
		if (overrides.transparent) {
			material.transparent = overrides.transparent;
		}
		if (overrides.opacity) {
			material.transparent = true;
			material.opacity = overrides.opacity;
		} else {
			material.transparent = false;
		}
		if (overrides.position) {
			object.position.copy(overrides.position);
		}
		if (overrides.scale) {
			if (overrides.scale instanceof THREE.Vector3) {
				object.scale.copy(overrides.scale);
			} else if (!isNaN(overrides.scale)) {
				object.scale.set(1, 1, 1);
				object.scale.multiplyScalar(overrides.scale);
			}
		}
		if (overrides.rotation) {
			object.rotation.copy(overrides.rotation);
		}
		return object;
	}

	getObject(overrides? : ObjectOverrides) : T {
		for (let object of this._objects) {
		    this._objects.delete(object);
		    ObjectBuffer.applyOverrides(object, overrides);
		    return object;
		}

		let object = this._create();
		ObjectBuffer.applyOverrides(object, overrides);
		return object;
	}

	returnObject(object : T) {
		if (!Util.defined(object)) {
			return;
		}
		this._objects.add(object);
	}
}

export interface ObjectOverrides {
	// Material overrides
	color? : any;
	transparent? : boolean;
	opacity? : number;

	// Object overrides
	position? : THREE.Vector3;
	scale? : any;
	rotation? : THREE.Euler;
}