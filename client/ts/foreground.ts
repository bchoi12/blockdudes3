import * as THREE from 'three';

import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'

export class Foreground extends SceneComponent {

	private readonly _frontMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, transparent: true });
	private readonly _backMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );
	private _wall : THREE.Mesh;
	private _wallBox : THREE.Box2;

	constructor() {
		super();

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
		light.position.set(18, 6.25, 1);
		this._scene.add(light);

		let light2 = new THREE.PointLight(0x6666ff, 4, 10);
		light2.position.set(26, 6.25, 1);
		this._scene.add(light2);

		this._wallBox = new THREE.Box2(new THREE.Vector2(13.5, 3.5), new THREE.Vector2(30.5, 10));
	}

	override update() : void {
		super.update();

		const position = renderer.cameraTarget();

		if (this._wallBox.containsPoint(new THREE.Vector2(position.x, position.y))) {
			// @ts-ignore
			if (this._wall.material.opacity > 0.2) {
				// @ts-ignore
				this._wall.material.opacity -= 0.03;
			}
		} else {
			// @ts-ignore
			if (this._wall.material.opacity < 1.0) {
				// @ts-ignore
				this._wall.material.opacity += 0.03;
				// TODO: need clamping
			}
		}
	}
}