import * as THREE from 'three';

import { game } from './game.js'
import { RenderPlayer } from './render_player.js'
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

	changed() : boolean {
		if (this._lastKeys.size !== this._keys.size) {
			return true;
		}

		for (let it = this._keys.values(), val = null; val = it.next().value;) {
		    if (!this._lastKeys.has(val)) {
		    	return true;
		    }
		}

		return false;
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
				D: this.weaponDir(),
			},
		};
		return msg;
	}

	keyPressed(key : number) : boolean { return this._keys.has(key) && !this._lastKeys.has(key); }
	keyDown(key : number) : boolean { return this._keys.has(key); }
	keyReleased(key : number) : boolean { return !this._keys.has(key) && this._lastKeys.has(key); }

	private dir() : any {
		if (!game.sceneMap().has(playerSpace, game.id())) {
			return new THREE.Vector2(1, 0);
		}

   		const mouse = renderer.getMouseWorld();
   		const player : RenderPlayer = game.sceneMap().getAsAny(playerSpace, game.id());
   		const pos = player.pos();
   		let dir = new THREE.Vector2(mouse.x - pos.x, mouse.y - pos.y);
   		dir.normalize();

   		return {X: dir.x, Y: dir.y};
	}
	private weaponDir() : any {
		if (!game.sceneMap().has(playerSpace, game.id())) {
			return new THREE.Vector2(1, 0);
		}

   		const mouse = renderer.getMouseWorld();
   		const player : RenderPlayer = game.sceneMap().getAsAny(playerSpace, game.id());
   		const weaponPos = player.weaponPos();
   		let dir = new THREE.Vector2(mouse.x - weaponPos.x, mouse.y - weaponPos.y);
   		dir.normalize();

   		return {X: dir.x, Y: dir.y};
	}
}