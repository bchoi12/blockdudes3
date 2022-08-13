import * as THREE from 'three';

import { Util } from './util.js'

class Options {
	public fullClientPrediction : boolean;
	public pointerLock : boolean;
	public enableShadows : boolean;
	public enableEffects : boolean;
	public enableDynamicLighting : boolean;
	public rendererScale : number;

	public extrapolateMs : number;
	public extrapolateWeight : number;

	public scoreboardKeyCode : number = 192;
	public pauseKeyCode : number = 27;
	public chatKeyCode : number = 13;

	constructor() {
		THREE.Cache.enabled = true;

		this.fullClientPrediction = true;
		this.pointerLock = true;
		this.enableShadows = true;
		this.enableEffects = !Util.isDev();
		this.enableDynamicLighting = !Util.isDev();
		this.rendererScale = 0.66;

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