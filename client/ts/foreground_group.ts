import * as THREE from 'three';

import { EffectType } from './effects.js'
import { options } from './options.js'
import { renderer } from './renderer.js'

export class ForegroundGroup {
	private readonly _maxOpacity = 1.0;
	private readonly _minOpacity = 0.1;
	private readonly _opacityChange = 2.0;
	
	private _scene : THREE.Scene;
	private _materials : Set<THREE.Material>;
	private _transparent : boolean;
	private _opacity : number;

	constructor() {
		this._scene = new THREE.Scene();
		this._materials = new Set();
		this._transparent = false;
		this._opacity = 1.0;
	}

	scene() : THREE.Scene { return this._scene; }
	setTransparent(transparent : boolean) : void { this._transparent = transparent; }

	add(mesh : THREE.Mesh) {
		// @ts-ignore
		this._materials.add(mesh.material);

		mesh.castShadow = false;
		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}
		this._scene.add(mesh);

		if (options.enableShadows) {
			const shadow = new THREE.Mesh(mesh.geometry, new THREE.ShadowMaterial());
			shadow.position.copy(mesh.position);
			shadow.castShadow = true;
			shadow.receiveShadow = false;
			this._scene.add(shadow);
		}
	}

	update(ts : number) : void {
		if (this._transparent && this._opacity <= this._minOpacity) {
			return;
		}
		if (!this._transparent && this._opacity >= this._maxOpacity) {
			return;
		}

		if (this._transparent) {
			this._opacity = Math.max(this._minOpacity, this._opacity - ts * this._opacityChange);
		} else {
			this._opacity = Math.min(this._maxOpacity, this._opacity + ts * this._opacityChange);
		}

		this._materials.forEach((material) => {
			material.opacity = this._opacity;
		})
	}
}