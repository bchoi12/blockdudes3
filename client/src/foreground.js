import * as THREE from 'three';
import { renderer } from './renderer.js';
import { SceneComponent } from './scene_component.js';
export class Foreground extends SceneComponent {
    constructor() {
        super();
        this._frontMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true });
        this._backMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, shadowSide: THREE.FrontSide });
        this._wall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 0.5), this._frontMaterial);
        this._wall.position.x = 22;
        this._wall.position.y = 6.75;
        this._wall.position.z = 2.25;
        this._wall.castShadow = false;
        this._wall.receiveShadow = true;
        this._scene.add(this._wall);
        this._shadowWall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 0.5), new THREE.ShadowMaterial());
        this._shadowWall.position.x = 22;
        this._shadowWall.position.y = 6.75;
        this._shadowWall.position.z = 2.25;
        this._shadowWall.castShadow = true;
        this._shadowWall.receiveShadow = false;
        this._scene.add(this._shadowWall);
        let backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 0.5), this._backMaterial);
        backWall.position.x = 22;
        backWall.position.y = 6.75;
        backWall.position.z = -2.25;
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this._scene.add(backWall);
        let light = new THREE.PointLight(0xff6666, 4, 10);
        light.position.set(18, 6.25, 1);
        this._scene.add(light);
        let light2 = new THREE.PointLight(0x6666ff, 4, 10);
        light2.position.set(26, 6.25, 1);
        this._scene.add(light2);
        this._wallBox = new THREE.Box2(new THREE.Vector2(13.5, 3.5), new THREE.Vector2(30.5, 10));
    }
    update() {
        super.update();
        const position = renderer.cameraTarget();
        if (this._wallBox.containsPoint(new THREE.Vector2(position.x, position.y))) {
            if (this._wall.material.opacity > 0.3) {
                this._wall.material.opacity -= 0.03;
            }
        }
        else {
            if (this._wall.material.opacity < 1.0) {
                this._wall.material.opacity += 0.03;
            }
        }
    }
}
