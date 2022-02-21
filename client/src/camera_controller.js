import * as THREE from 'three';
export class CameraController {
    constructor(aspect) {
        this._cameraOffset = new THREE.Vector3(0, 1.2, 30.0);
        this._targetOffset = new THREE.Vector3(0, 0.5, 0);
        this._camera = new THREE.PerspectiveCamera(20, aspect, 0.1, 1000);
        this.setTarget(new THREE.Vector3());
    }
    camera() {
        return this._camera;
    }
    target() {
        return this._target;
    }
    setTarget(targetPos) {
        this._target = targetPos.clone();
        this._target.y = Math.max(this._cameraOffset.y, this._target.y);
        this._camera.position.copy(this._target);
        this._camera.position.add(this._cameraOffset);
        this._target.add(this._targetOffset);
        this._camera.lookAt(this._target);
    }
    setAspect(aspect) {
        this._camera.aspect = aspect;
        this._camera.updateProjectionMatrix();
    }
}
