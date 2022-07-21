import * as THREE from 'three';

import { game } from './game.js'
import { renderer } from './renderer.js'
import { ui } from './ui.js'

export class Keys {
	
	private _lastKeys : Set<number>;
	private _keys : Set<number>;

	constructor() {
		this._lastKeys = new Set();
		this._keys = new Set();
	}

	snapshotKeys() : void {
		this._lastKeys = new Set(this._keys);
		this._keys = ui.getKeys();
	}

	keyMsg(keySeqNum : number) : { [k: string]: any } {
   		const mouse = renderer.getMouseWorld();
		const msg = {
			T: keyType,
			Key: {
				S: keySeqNum,
				K: Array.from(this._keys),
				M: {
					X: mouse.x,
					Y: mouse.y,
				},
				D: {
					X: 1,
					Y: 0,
				},
			},
		};

		if (game.sceneMap().has(playerSpace, game.id())) {
	   		const mouse = renderer.getMouseWorld();

	   		const player : any = game.sceneMap().get(playerSpace, game.id());
	   		const weaponPos = player.weaponPos();
	   		const dir = new THREE.Vector2(mouse.x - weaponPos.x, mouse.y - weaponPos.y);

	   		dir.normalize();
			msg.Key.D = {
				X: dir.x,
				Y: dir.y,
			};
		} 
		return msg;
	}

	keyPressed(key : number) : boolean { return this._keys.has(key) && !this._lastKeys.has(key); }
	keyDown(key : number) : boolean { return this._keys.has(key); }
	keyReleased(key : number) : boolean { return !this._keys.has(key) && this._lastKeys.has(key); }
}