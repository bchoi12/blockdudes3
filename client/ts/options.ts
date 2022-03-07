import * as THREE from 'three';

class Options {
	public pointerLock : boolean;

	public enableShadows : boolean;
	public rendererScale : number;

	constructor() {
		THREE.Cache.enabled = true;

		this.pointerLock = true;
		this.enableShadows = true;
		this.rendererScale = 0.66;
	}

	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();