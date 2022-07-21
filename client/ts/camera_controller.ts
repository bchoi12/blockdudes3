import * as THREE from 'three';

import { Interp } from './interp.js'
import { Timer } from './timer.js'

export class CameraController {
	private readonly _cameraOffset = new THREE.Vector3(0, 1.2, 30.0);
	private readonly _lookAtOffset = new THREE.Vector3(0, 0.5, 0);
	private readonly _panTiming = 250; // ms

	private _camera : THREE.PerspectiveCamera;
	private _target : THREE.Vector3;
	private _anchor : THREE.Vector3;

	private _pan : THREE.Vector3;
	private _panTimer : Timer;
	private _panInterp : Interp;

	constructor(aspect : number) {
		this._camera = new THREE.PerspectiveCamera(20, aspect, 0.1, 1000);
		this._target = new THREE.Vector3();
		this._anchor = new THREE.Vector3();

		this._pan = new THREE.Vector3();
		this._panTimer = new Timer(this._panTiming);
		this._panInterp = new Interp(0, 1);
		this._panInterp.capMax(true);
		this._panInterp.setFn((x: number) => { return -(x * x) + 2 * x; })

		this.setAnchor(this._anchor);
	}

	camera() : THREE.PerspectiveCamera { return this._camera; }
	target() : THREE.Vector3 { return this._target; }
	anchor() : THREE.Vector3 { return this._anchor; }
	pan() : THREE.Vector3 { return this._pan; }
	panEnabled() : boolean { return this._panTimer.enabled(); }

	setAnchor(anchor: THREE.Vector3) : void {
		this._anchor = anchor.clone();
		this._anchor.y = Math.max(this._cameraOffset.y, this._anchor.y);

		this._camera.position.copy(this._anchor);
		this._camera.position.add(this._cameraOffset);
		this._target = this._anchor.clone();
		this._target.add(this._lookAtOffset);

		let pan = new THREE.Vector3();
		if (this._panTimer.enabled()) {
			const linearWeight = this._panTimer.weight();
			const weight = this._panInterp.get(linearWeight);

			pan = this._pan.clone();
			pan.multiplyScalar(weight);
		}

		this._camera.position.add(pan);
		this._target.add(pan);

		this._camera.position.y = Math.max(this._cameraOffset.y, this._camera.position.y);
		this._target.y = Math.max(this._cameraOffset.y, this._target.y);

		this._camera.lookAt(this._target);
	}

	enablePan(pan : THREE.Vector3) : void {
		this._pan = pan.clone();
		this._pan.y = Math.min(4, this._pan.y);
		this._pan.y = Math.max(-4, this._pan.y);
		this._panTimer.start();
	}

	disablePan() : void {
		this._panTimer.stop();
	}

	setAspect(aspect : number) {
		this._camera.aspect = aspect;
		this._camera.updateProjectionMatrix();
	}
}