import * as THREE from 'three';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js';
import { Howl } from 'howler';
import { RenderMesh } from './render_mesh.js';
export class RenderWeapon extends RenderMesh {
    constructor() {
        super();
        this._shotLocation = "shoot";
        this._rayMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this._gyro = new Gyroscope();
        this._shotOrigin = new THREE.Vector3(0, 0, 0);
        this._light = new THREE.PointLight(0x00ff00, 0, 3);
        this._shootSound = new Howl({
            src: ["./sound/test.wav"]
        });
    }
    setMesh(mesh) {
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.z = -1;
        this._shotOrigin = mesh.getObjectByName(this._shotLocation).position.clone();
        this._light.position.copy(this._shotOrigin);
        mesh.add(this._light);
        super.setMesh(mesh);
    }
    shotOrigin() {
        return this._shotOrigin.clone();
    }
}
