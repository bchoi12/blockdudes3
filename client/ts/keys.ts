import * as THREE from 'three';

import { game } from './game.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { ui } from './ui.js'

export class Keys {
	private _keys : Set<number>;
	private _lastKeys : Set<number>;

	constructor() {
		this._keys = new Set();
		this._lastKeys = new Set();
	}

	snapshotKeys() : void {
		this._lastKeys = new Set(this._keys);
		this._keys = new Set(ui.getKeys());
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

	changed() : boolean {
		if (this._lastKeys.size !== this._keys.size) {
			return true;
		}

		for(let key of this._keys) {
			if (!this._lastKeys.has(key)) {
				return true;
			}
		}

		return false;
	}


	keyPressed(key : number) : boolean { return this._keys.has(key) && !this._lastKeys.has(key); }
	keyDown(key : number) : boolean { return this._keys.has(key); }
	keyReleased(key : number) : boolean { return !this._keys.has(key) && this._lastKeys.has(key); }

	dir() : any {
		if (!game.sceneMap().has(playerSpace, game.id())) {
			return {X: 1, Y: 0};
		}

   		const mouse = renderer.getMouseWorld();
   		const player : RenderPlayer = game.sceneMap().getAsAny(playerSpace, game.id());
   		const pos = player.pos();
   		let dir = new THREE.Vector2(mouse.x - pos.x, mouse.y - pos.y);
   		dir.normalize();

   		return {X: dir.x, Y: dir.y};
	}
	weaponDir() : any {
		if (!game.sceneMap().has(playerSpace, game.id())) {
			return {X: 1, Y: 0};
		}

   		const mouse = renderer.getMouseWorld();
   		const player : RenderPlayer = game.sceneMap().getAsAny(playerSpace, game.id());
   		const shootingOrigin = player.shootingOrigin();
   		let dir = new THREE.Vector2(mouse.x - shootingOrigin.x, mouse.y - shootingOrigin.y);
   		dir.normalize();

   		return {X: dir.x, Y: dir.y};
	}
}