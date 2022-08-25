import * as THREE from 'three';

import { Util } from './util.js'

class Options {
	public enableClientPrediction : boolean;
	public enablePointerLock : boolean;
	public enableShadows : boolean;
	public enableEffects : boolean;
	public enableDynamicLighting : boolean;
	public rendererScale : number;
	public rendererMultisampling : number;

	public soundEffectVolume : number;

	public extrapolateMs : number;
	public extrapolateWeight : number;

	public scoreboardKeyCode : number = 192;
	public pauseKeyCode : number = 27;
	public chatKeyCode : number = 13;

	constructor() {
		THREE.Cache.enabled = true;

		this.enableClientPrediction = true;
		this.enablePointerLock = true;
		this.enableShadows = true;
		this.enableEffects = true;
		this.enableDynamicLighting = true;
		this.rendererScale = 0.7;
		this.rendererMultisampling = 2;

		this.soundEffectVolume = 0.5;

		this.extrapolateMs = 100;
		this.extrapolateWeight = 0.5;

		this.load();
	}

	// TODO: save and load from cookie
	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();