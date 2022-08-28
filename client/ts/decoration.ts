import * as THREE from 'three';

import { ForegroundGroup } from './foreground_group.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'

export class Decoration extends SceneComponent {

	private _miscObjects : Array<THREE.Object3D>;

	constructor() {
		super();
		this._miscObjects = new Array();
	}

	override update() : void {
		super.update();
	}

	override initLevel() : void {
		{
			let light = new THREE.PointLight(0xff6666, 4, 10);
			light.position.set(18, 6.25, 1);
			this._scene.add(light);
			this._miscObjects.push(light);
		}

		{
			let light = new THREE.PointLight(0x6666ff, 4, 10);
			light.position.set(26, 6.25, 1);
			this._scene.add(light);
			this._miscObjects.push(light);
		}

		{
			let light = new THREE.PointLight(0xeeeeee, 4, 10);
			light.position.set(4, 2, 1);
			this._scene.add(light);
			this._miscObjects.push(light);
		}

		{
			let light = new THREE.PointLight(0xAD07DB, 4, 10);
			light.position.set(40, 1, 1);
			this._scene.add(light);
			this._miscObjects.push(light);
		}

		{
			let light = new THREE.PointLight(0xc306d1, 4, 10);
			light.position.set(56, 1, 1);
			this._scene.add(light);
			this._miscObjects.push(light);
		}

		// TODO: experiment to see if this removes some lag
		renderer.compile(this._scene);
	}

	override reset() : void {
		this._miscObjects.forEach((object) => {
			this._scene.remove(object);
		});
	}
}