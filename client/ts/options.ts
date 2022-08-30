import * as THREE from 'three';

import { Util } from './util.js'

class Options {
	public scoreboardKeyCode : number = 192;
	public pauseKeyCode : number = 27;
	public chatKeyCode : number = 13;

	public enablePointerLock : boolean;
	public enableShadows : boolean;
	public enableEffects : boolean;
	public enableDynamicLighting : boolean;
	public enableAntialiasing : boolean;

	public rendererScale : number;
	public rendererMultisampling : number;
	public soundVolume : number;
	public extrapolateWeight : number;
	public extrapolateMs : number;

	constructor() {
		THREE.Cache.enabled = true;

		this.enablePointerLock = true;
		this.enableShadows = true;
		this.enableEffects = true;
		this.enableDynamicLighting = true;
		this.enableAntialiasing = false;

		this.rendererScale = 1.0;
		this.rendererMultisampling = 0;
		this.soundVolume = 0.5;
		this.extrapolateWeight = 0.5;
		this.extrapolateMs = 100;

		this.load();
	}

	// TODO: save and load from cookie
	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();