import * as THREE from 'three';
import { RenderObject } from './render_object.js';
export class RenderWeapon extends RenderObject {
    constructor(mesh) {
        super(mesh);
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        this._bombMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        mesh.rotation.x = Math.PI / 2;
        mesh.scale.z = -1;
        this._shotOrigin = mesh.getObjectByName("shoot").position;
        this._light = new THREE.PointLight(0x00ff00, 3, 3);
        this._light.position.copy(this._shotOrigin);
        this._light.visible = false;
        mesh.add(this._light);
    }
    shoot(shot) {
        const endpoint = shot[endPosProp];
        const points = [
            this._shotOrigin,
            this._mesh.worldToLocal(new THREE.Vector3(endpoint.X, endpoint.Y, 0)),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = shot[shotTypeProp] == burstShotType ? this._lineMaterial : this._bombMaterial;
        const line = new THREE.Line(geometry, material);
        this._mesh.add(line);
        if (shot[shotTypeProp] == burstShotType) {
            this._light.color.setHex(0x00ff00);
        }
        else {
            this._light.color.setHex(0x0000ff);
        }
        this._light.visible = true;
        setTimeout(() => {
            this._mesh.remove(line);
            this._light.visible = false;
        }, 50);
    }
}
