import * as THREE from 'three';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js';
import { Howl } from 'howler';
import { RenderMesh } from './render_mesh.js';
import { renderer } from './renderer.js';
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
        this._blastSound = new Howl({
            src: ["./sound/test2.wav"]
        });
    }
    setMesh(mesh) {
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.z = -1;
        mesh.add(this._gyro);
        this._shotOrigin = mesh.getObjectByName(this._shotLocation).position.clone();
        this._light.position.copy(this._shotOrigin);
        mesh.add(this._light);
        super.setMesh(mesh);
    }
    shotOrigin() {
        return this._shotOrigin.clone();
    }
    shoot(msg, seqNum) {
        super.update(msg, seqNum);
        const pos = this.pos();
        if (msg[shotTypeProp] == rocketShotType) {
            renderer.playSound(this._blastSound, new THREE.Vector3(pos.x, pos.y, 0));
            return;
        }
        const localPos = this.endPos().sub(pos);
        const angle = localPos.angle();
        const range = localPos.length();
        const geometry = new THREE.BoxGeometry(range, 0.1, 0.1);
        const ray = new THREE.Mesh(geometry, this._rayMaterial);
        ray.rotation.z = this.parent().dir().x > 0 ? Math.PI - angle : angle;
        ray.position.x = Math.cos(ray.rotation.z) * range / 2;
        ray.position.y = Math.sin(ray.rotation.z) * range / 2;
        this._gyro.add(ray);
        if (msg[shotTypeProp] == burstShotType) {
            this._light.color.setHex(0x00ff00);
        }
        else {
            this._light.color.setHex(0x0000ff);
        }
        this._light.intensity = 3;
        renderer.playSound(this._shootSound, new THREE.Vector3(pos.x, pos.y, 0));
        setTimeout(() => {
            this._gyro.remove(ray);
            this._light.intensity = 0;
        }, 60);
    }
}
