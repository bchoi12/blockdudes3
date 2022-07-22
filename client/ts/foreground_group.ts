import * as THREE from 'three';

import { options } from './options.js'
import { renderer } from './renderer.js'

export class ForegroundGroup {
	private readonly _maxOpacity = 1.0;
	private readonly _minOpacity = 0.3;
	private readonly _opacityChange = 0.03;
	
	private _boundingBox : THREE.Box2;
	private _scene : THREE.Scene;
	private _materials : Set<THREE.Material>;
	private _transparent : boolean;
	private _opacity : number;

	constructor(box : THREE.Box2) {
		this._boundingBox = box;
		this._scene = new THREE.Scene();
		this._materials = new Set();
		this._transparent = false;
		this._opacity = 1.0;
	}

	scene() : THREE.Scene { return this._scene; }

	add(mesh : THREE.Mesh) {
		// @ts-ignore
		this._materials.add(mesh.material);

		if (options.enableShadows) {
			mesh.castShadow = false;
			mesh.receiveShadow = true;
		}
		this._scene.add(mesh);

		const shadow = new THREE.Mesh(mesh.geometry, new THREE.ShadowMaterial());
		shadow.position.copy(mesh.position);
		
		if (options.enableShadows) {
			shadow.castShadow = true;
			shadow.receiveShadow = false;
		}
		this._scene.add(shadow);
	}

	update() : void {
		const position = renderer.cameraAnchor();
		this._transparent = this._boundingBox.containsPoint(new THREE.Vector2(position.x, position.y));

		if (this._transparent && this._opacity <= this._minOpacity) {
			return;
		}
		if (!this._transparent && this._opacity >= this._maxOpacity) {
			return;
		}

		if (this._transparent) {
			this._opacity = Math.max(this._minOpacity, this._opacity - this._opacityChange);
		} else {
			this._opacity = Math.min(this._maxOpacity, this._opacity + this._opacityChange);
		}

		this._materials.forEach((material) => {
			material.opacity = this._opacity;
		})
	}
}