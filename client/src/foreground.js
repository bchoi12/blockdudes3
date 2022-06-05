import * as THREE from 'three';
import { renderer } from './renderer.js';
import { SceneComponent } from './scene_component.js';
export class Foreground extends SceneComponent {
    constructor() {
        super();
        this._frontMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true });
        this._backMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, shadowSide: THREE.FrontSide });
        this._wallGroup = new THREE.Scene();
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 15;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            wall.castShadow = false;
            wall.receiveShadow = true;
            this._wallGroup.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 29;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            wall.castShadow = false;
            wall.receiveShadow = true;
            this._wallGroup.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 19;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            wall.castShadow = false;
            wall.receiveShadow = true;
            this._wallGroup.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 25;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            wall.castShadow = false;
            wall.receiveShadow = true;
            this._wallGroup.add(wall);
        }
        this._scene.add(this._wallGroup);
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
        this._wallBox = new THREE.Box2(new THREE.Vector2(14, 3.5), new THREE.Vector2(30, 10));
    }
    update() {
        super.update();
        const position = renderer.cameraTarget();
        if (this._wallBox.containsPoint(new THREE.Vector2(position.x, position.y))) {
            this._wallGroup.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    if (node.material.opacity > 0.3) {
                        node.material.opacity -= 0.03;
                    }
                }
            });
        }
        else {
            this._wallGroup.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    if (node.material.opacity < 1.0) {
                        node.material.opacity += 0.03;
                    }
                }
            });
        }
    }
}
