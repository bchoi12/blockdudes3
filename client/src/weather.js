import * as THREE from 'three';
import { SceneComponent } from './scene_component.js';
export class Weather extends SceneComponent {
    constructor() {
        super();
        this._cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.7, shadowSide: THREE.FrontSide });
        this._frontMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true });
        this._backMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, shadowSide: THREE.FrontSide });
        this._clouds = new Array();
        let cloud = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.0, 6.0), this._cloudMaterial);
        cloud.position.x = 6;
        cloud.position.y = 4;
        cloud.position.z = -12;
        cloud.castShadow = true;
        this._clouds.push(cloud);
        cloud = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.8, 6.0), this._cloudMaterial);
        cloud.position.x = -2;
        cloud.position.y = 2;
        cloud.position.z = -6;
        cloud.castShadow = true;
        this._clouds.push(cloud);
        cloud = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.0, 6.0), this._cloudMaterial);
        cloud.position.x = 2;
        cloud.position.y = 6;
        cloud.position.z = 6;
        cloud.castShadow = true;
        this._clouds.push(cloud);
        this._clouds.forEach((cloud) => {
            this._scene.add(cloud);
        });
        this._wall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 0.5), this._frontMaterial);
        this._wall.position.x = 22;
        this._wall.position.y = 6.75;
        this._wall.position.z = 2.25;
        this._wall.castShadow = false;
        this._wall.receiveShadow = true;
        this._scene.add(this._wall);
        let backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 0.5), this._backMaterial);
        backWall.position.x = 22;
        backWall.position.y = 6.75;
        backWall.position.z = -2.25;
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this._scene.add(backWall);
        let light = new THREE.PointLight(0xff6666, 4, 10);
        light.position.set(18, 6.25, 0);
        this._scene.add(light);
        let light2 = new THREE.PointLight(0x6666ff, 4, 10);
        light2.position.set(26, 6.25, 0);
        this._scene.add(light2);
        this._wallBox = new THREE.Box2(new THREE.Vector2(13.5, 3.5), new THREE.Vector2(30.5, 10));
    }
    update(position) {
        this._clouds.forEach((cloud) => {
            cloud.position.x += 0.01;
            if (cloud.position.x > 40) {
                cloud.position.x = -5;
            }
        });
        console.log(this._wall);
        if (this._wallBox.containsPoint(new THREE.Vector2(position.x, position.y))) {
            if (this._wall.material.opacity > 0.2) {
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
