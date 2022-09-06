import * as THREE from 'three'

import { renderer } from './renderer.js'
import { Util } from './util.js'

export class ObjectBuffer<T extends THREE.Object3D> {
	private readonly _maxBufferSize = 10;

	private _objects : Set<T>;
	private _create : () => T;
	private _maxSize : number;

	constructor(create : () => T, size? : number) {
		this._objects = new Set<T>();
		this._create = create;
		this._maxSize = Util.defined(size) ? size : this._maxBufferSize;
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

		if (overrides.attach) {
			overrides.attach.add(object);
		}

		object.position.copy(overrides.position);
		if (overrides.scale instanceof THREE.Vector3) {
			object.scale.copy(overrides.scale);
		} else {
			object.scale.set(1, 1, 1);
			if (!isNaN(overrides.scale)) {
				object.scale.multiplyScalar(overrides.scale);
			}
		}
		if (overrides.rotation) {
			if (overrides.rotation instanceof THREE.Quaternion) {
				object.rotation.setFromQuaternion(overrides.rotation);
			} else if (overrides.rotation instanceof THREE.Euler) {		
				object.rotation.copy(overrides.rotation);
			}
		}

		if (object instanceof THREE.InstancedMesh && overrides.instances) {
			for (let i = 0; i < object.count; ++i) {
				let pos = overrides.instances.posFn ? overrides.instances.posFn(object, i) : new THREE.Vector3();
				let scale = overrides.instances.scaleFn ? overrides.instances.scaleFn(object, i) : new THREE.Vector3(1, 1, 1);
				let rotation = overrides.instances.rotationFn ? overrides.instances.rotationFn(object, i) : new THREE.Quaternion();

				let matrix = new THREE.Matrix4();
				matrix.compose(pos, rotation, scale);
				object.setMatrixAt(i, matrix);

				let color = new THREE.Color();
				if (overrides.instances.colorFn) {
					let color = overrides.instances.colorFn(object, i);
					if (color instanceof THREE.Color) {
						object.setColorAt(i, color);
					} else if (!isNaN(color)) {
						object.setColorAt(i, new THREE.Color(color));
					}
				}
			}

			if (object.instanceMatrix) {
				object.instanceMatrix.needsUpdate = true;
			}

			if (object.instanceColor) {
				object.instanceColor.needsUpdate = true;
			}
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

		if (this._objects.size < this._maxSize) {
			this._objects.add(object);
		}
	}
}

export interface InstanceOptions {
	posFn? : (object? : THREE.InstancedMesh, i? : number) => THREE.Vector3;
	scaleFn? : (object? : THREE.InstancedMesh, i? : number) => THREE.Vector3;
	rotationFn? : (object? : THREE.InstancedMesh, i? : number) => THREE.Quaternion
	colorFn? : (object? : THREE.InstancedMesh, i? : number) => any;
}

export interface ObjectOverrides {
	// Material overrides
	color? : any;
	transparent? : boolean;
	opacity? : number;

	// Object overrides
	attach? : THREE.Object3D;
	position : THREE.Vector3;
	scale : any;
	rotation? : THREE.Quaternion | THREE.Euler;

	// Instance overrides
	instances? : InstanceOptions;
}