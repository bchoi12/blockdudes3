import * as THREE from 'three';
import { Howl } from 'howler';
import { RenderMesh } from './render_mesh.js';
import { renderer } from './renderer.js';
export class RenderWeapon extends RenderMesh {
    constructor() {
        super();
        this._shotLocation = "shoot";
        this._rayMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this._shotOrigin = new THREE.Vector3(0, 0, 0);
        this._light = new THREE.PointLight(0x00ff00, 0, 3);
        this._shootSound = new Howl({
            src: ["./sound/test.wav"]
        });
        this._blastSound = new Howl({
            src: ["./sound/test2.wav"]
        });
    }
    setMesh(mesh) {
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.z = -1;
        this._shotOrigin = mesh.getObjectByName(this._shotLocation).position;
        this._light.position.copy(this._shotOrigin);
        mesh.add(this._light);
        super.setMesh(mesh);
    }
    shoot(msg) {
        super.update(msg);
        const pos = this.pos();
        if (msg[shotTypeProp] == rocketShotType) {
            renderer.playSound(this._blastSound, new THREE.Vector3(pos.x, pos.y, 0));
            return;
        }
        const endpoint = msg[endPosProp];
        const points = [
            this._shotOrigin,
            this._mesh.worldToLocal(new THREE.Vector3(endpoint.X, endpoint.Y, 0)),
        ];
        const startLocal = this._mesh.worldToLocal(new THREE.Vector3(pos.x, pos.y, this._shotOrigin.z));
        const endLocal = this._mesh.worldToLocal(new THREE.Vector3(endpoint.X, endpoint.Y, this._shotOrigin.z));
        const posLocal = endLocal.clone().sub(startLocal).multiplyScalar(0.5);
        const geometry = new THREE.BoxGeometry(0.1, endLocal.length(), 0.1);
        const ray = new THREE.Mesh(geometry, this._rayMaterial);
        ray.rotation.x = Math.PI / 2;
        ray.position.copy(posLocal);
        this._mesh.add(ray);
        if (msg[shotTypeProp] == burstShotType) {
            this._light.color.setHex(0x00ff00);
        }
        else {
            this._light.color.setHex(0x0000ff);
        }
        this._light.intensity = 3;
        renderer.playSound(this._shootSound, new THREE.Vector3(pos.x, pos.y, 0));
        setTimeout(() => {
            this._mesh.remove(ray);
            this._light.intensity = 0;
        }, 60);
    }
}
