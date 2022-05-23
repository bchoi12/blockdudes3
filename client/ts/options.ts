import * as THREE from 'three';

class Options {
	public clientPrediction : boolean;
	public pointerLock : boolean;
	public enableShadows : boolean;
	public rendererScale : number;

	constructor() {
		THREE.Cache.enabled = true;

		this.clientPrediction = true;
		this.pointerLock = true;
		this.enableShadows = true;
		this.rendererScale = 0.66;

		this.load();
	}

	// TODO: save and load from cookie
	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();