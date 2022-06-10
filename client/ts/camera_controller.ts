import * as THREE from 'three';

export class CameraController {
	private readonly _cameraOffset = new THREE.Vector3(0, 1.2, 30.0);
	private readonly _lookAtOffset = new THREE.Vector3(0, 0.5, 0);

	private _camera : THREE.PerspectiveCamera;
	private _target : THREE.Vector3;

	constructor(aspect : number) {
		this._camera = new THREE.PerspectiveCamera(20, aspect, 0.1, 1000);
		this._target = new THREE.Vector3();

		this.setTarget(this._target);
	}

	camera() : THREE.PerspectiveCamera { return this._camera; }
	target() : THREE.Vector3 { return this._target; }

	setTarget(targetPos: THREE.Vector3) : void {
		this._target = targetPos.clone();
		this._target.y = Math.max(this._cameraOffset.y, this._target.y);

		this._camera.position.copy(this._target);
		this._camera.position.add(this._cameraOffset);
		let lookAt = this._target.clone();
		lookAt.add(this._lookAtOffset);
		this._camera.lookAt(lookAt);
	}

	setAspect(aspect : number) {
		this._camera.aspect = aspect;
		this._camera.updateProjectionMatrix();
	}
}