import * as THREE from 'three'

import { options } from './options.js'
import { renderer } from './renderer.js'
import { LogUtil, Util } from './util.js'

export class LightBuffer {

	private readonly _bufferSize : number = 20;

	private _scene : THREE.Scene;
	private _allPointLights : Set<THREE.PointLight>;
	private _pointLights : Set<THREE.PointLight>;

	constructor(scene : THREE.Scene) {
		this._scene = scene;
		this._allPointLights = new Set<THREE.PointLight>();
		this._pointLights = new Set<THREE.PointLight>();

		for (let i = 0; i < this._bufferSize; ++i) {
			let pointLight = new THREE.PointLight(0xFFFFFF, 1, 1);
			this._allPointLights.add(pointLight);
			this._pointLights.add(pointLight);
			scene.add(pointLight);
		}
		renderer.compile(scene);

		this._pointLights.forEach((light) => {
			light.intensity = 0;
		})
		renderer.compile(scene);
	}

	hasPointLight() : boolean {
		if (!options.enableDynamicLighting) {
			return false;
		}
		if (this._pointLights.size == 0) {
			return false;
		}
		return true;
	}

	getPointLight() : THREE.PointLight {
		if (!options.enableDynamicLighting) {
			return null;
		}

		// Typically this happens due to lag, just reset the buffer here.
		if (this._pointLights.size == 0) {
			for (let light of this._allPointLights) {
				this.returnPointLight(light);
			}
		}
		for (let light of this._pointLights) {
		    this._pointLights.delete(light);
		    return light;
		}
		return null;
	}

	returnPointLight(light : THREE.PointLight) {
		if (!Util.defined(light)) {
			return;
		}

		light.removeFromParent();
		light.intensity = 0;

		// Hack to prevent lag from destroying light
		this._scene.add(light);
		this._pointLights.add(light);
		
	}
}