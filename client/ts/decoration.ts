import * as THREE from 'three';

import { ForegroundGroup } from './foreground_group.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'

export class Decoration extends SceneComponent {

	private readonly _frontMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, transparent: true });
	private readonly _backMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );

	private _groups : Array<ForegroundGroup>;

	constructor() {
		super();
		this._groups = new Array();

		// random buildings in back
		{
			const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 6), new THREE.MeshStandardMaterial({color : 0x1a1a1a }));
			wall.position.x = 10;
			wall.position.y = 3;
			wall.position.z = -15;
			wall.castShadow = false;
			wall.receiveShadow = false;
			this._scene.add(wall);
		}
		{
			const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 6), new THREE.MeshStandardMaterial({color : 0x333333 }));
			wall.position.x = 22;
			wall.position.y = 5;
			wall.position.z = -15;
			wall.castShadow = false;
			wall.receiveShadow = false;
			this._scene.add(wall);
		}
		{
			const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 10), new THREE.MeshStandardMaterial({color : 0x222222 }));
			wall.position.x = 35;
			wall.position.y = 2;
			wall.position.z = -17;
			wall.castShadow = false;
			wall.receiveShadow = false;
			this._scene.add(wall);
		}
	}

	override update() : void {
		super.update();

		this._groups.forEach((group) => {
			group.update();
		});
	}

	override initLevel() : void {
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

	private newGroup(box : THREE.Box2) : ForegroundGroup {
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