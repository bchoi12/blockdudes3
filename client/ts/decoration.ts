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

	}

	override reset() : void {
		this._miscObjects.forEach((object) => {
			this._scene.remove(object);
		});
	}
}