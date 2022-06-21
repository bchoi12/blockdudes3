import * as THREE from 'three';
import { ForegroundGroup } from './foreground_group.js';
import { options } from './options.js';
import { SceneComponent } from './scene_component.js';
export class Decoration extends SceneComponent {
    constructor() {
        super();
        this._frontMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true });
        this._backMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, shadowSide: THREE.FrontSide });
        this._groups = new Array();
        const group = this.newGroup(new THREE.Box2(new THREE.Vector2(14, 4), new THREE.Vector2(30, 9.5)));
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 15;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            group.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 29;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            group.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 19;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            group.add(wall);
        }
        {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 5.5, 0.5), this._frontMaterial);
            wall.position.x = 25;
            wall.position.y = 6.75;
            wall.position.z = 2.25;
            group.add(wall);
        }
        this._groups.push(group);
        this._scene.add(group.scene());
        let light = new THREE.PointLight(0xff6666, 4, 10);
        light.position.set(18, 6.25, 1);
        this._scene.add(light);
        let light2 = new THREE.PointLight(0x6666ff, 4, 10);
        light2.position.set(26, 6.25, 1);
        this._scene.add(light2);
    }
    update() {
        super.update();
        this._groups.forEach((group) => {
            group.update();
        });
    }
    newGroup(box) {
        const group = new ForegroundGroup(box);
        this._groups.push(group);
        let size = new THREE.Vector2();
        let center = new THREE.Vector2();
        box.getSize(size);
        box.getCenter(center);
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, 0.5), this._backMaterial);
        backWall.position.x = center.x;
        backWall.position.y = center.y;
        backWall.position.z = -2.25;
        if (options.enableShadows) {
            backWall.castShadow = true;
            backWall.receiveShadow = true;
        }
        this._scene.add(backWall);
        return group;
    }
}
