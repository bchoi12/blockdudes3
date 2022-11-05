import * as THREE from 'three';

import { Util } from './util.js'

class Options {
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;
	public interactKeyCode : number;
	public mouseClickKeyCode : number;
	public altMouseClickKeyCode : number;

	public scoreboardKeyCode : number;
	public pauseKeyCode : number;
	public chatKeyCode : number;

	public enableFullscreen : boolean;
	public enablePointerLock : boolean;
	public enableShadows : boolean;
	public enableEffects : boolean;
	public enableAntialiasing : boolean;

	public resolution : number;
	public rendererMultisampling : number;
	public soundVolume : number;
	public extrapolateWeight : number;

	public debugShowWalls : boolean;

	constructor() {
		THREE.Cache.enabled = true;

		this.leftKeyCode = 65;
		this.rightKeyCode = 68;
		this.jumpKeyCode = 32;
		this.interactKeyCode = 69;
		this.mouseClickKeyCode = 83;
		this.altMouseClickKeyCode = 16;

		this.pauseKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;

		this.enableFullscreen = false;
		this.enablePointerLock = true;
		this.enableShadows = true;
		this.enableEffects = true;
		this.enableAntialiasing = true;

		this.resolution = 1.0;
		this.soundVolume = 0.5;
		this.extrapolateWeight = 1.0;

		this.debugShowWalls = false;

		this.load();
	}

	// TODO: save and load from cookie
	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();