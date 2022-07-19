import * as THREE from 'three';

import { connection } from './connection.js'
import { Model, loader } from './loader.js'
import { options } from './options.js'
import { RenderBolt } from './render_bolt.js'
import { RenderExplosion } from './render_explosion.js'
import { RenderObject } from './render_object.js'
import { RenderPaperStar } from './render_paper_star.js'
import { RenderPickup } from './render_pickup.js'
import { RenderPlayer } from './render_player.js'
import { RenderRocket } from './render_rocket.js'
import { RenderWall } from './render_wall.js'
import { RenderWeapon } from './render_weapon.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { SceneMap } from './scene_map.js'
import { ui } from './ui.js'
import { Util } from './util.js'

export enum GameState {
	UNKNOWN = 0,
	LOGIN = 1,
	LOBBY = 2,
	GAME = 3,
}

class Game {
	private readonly _statsInterval = 500;
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );

	private _id : number;
	private _state : GameState;

	private _sceneMap : SceneMap;
	private _lastKeys : Set<number>;
	private _keys : Set<number>;
	private _keyUpdates : number;
	private _lastSeqNum : number;
	private _animateFrames : number;

	constructor() {
		this._id = -1;
		this._state = GameState.UNKNOWN;

		this._sceneMap = new SceneMap();
		this._lastKeys = new Set();
		this._keys = new Set();
		this._keyUpdates = 0;
		this._lastSeqNum = 0;
		this._animateFrames = 0;
	}

	setup() : void {
		connection.addHandler(objectDataType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(objectUpdateType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(playerInitType, (msg : { [k: string]: any }) => { this.initPlayer(msg); });
		connection.addHandler(levelInitType, (msg : { [k: string]: any }) => { this.initLevel(msg); });

		this.animate();
	}

	hasId() : boolean { return this._id >= 0; }
	state() : GameState { return this._state; }
	sceneMap() : SceneMap { return this._sceneMap; }
	sceneComponent(type : SceneComponentType) : SceneComponent { return this._sceneMap.getComponent(type); }

	setState(state : GameState) { this._state = state; }

	private animate() : void {
		if (this.state() === GameState.GAME) {
			this.extrapolateState();
			this.updateCamera();
			this.extrapolatePlayerDir();
		}

		this.sceneMap().updateComponents()
		renderer.render();
		this._animateFrames++;

		requestAnimationFrame(() => { this.animate(); });
	}

	// TODO: this seems weird, fix it.
	private snapshotKeys() : { [k: string]: any } {
		this._lastKeys = new Set(this._keys);
		this._keys = ui.getKeys();
   		const mouse = renderer.getMouseWorld();
		const msg = {
			T: keyType,
			Key: {
				S: this._keyUpdates,
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

		if (this.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();

	   		const player : any = this.sceneMap().get(playerSpace, this._id);
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

	private keyPressed(key : number) : boolean { return this._keys.has(key) && !this._lastKeys.has(key); }
	private keyDown(key : number) : boolean { return this._keys.has(key); }
	private keyReleased(key : number) : boolean { return !this._keys.has(key) && this._lastKeys.has(key); }

	private initPlayer(msg : { [k: string]: any }) : void {
		this._id = msg.Id;
		for (const [stringId, data] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			if (this.sceneMap().has(playerSpace, id) || this.sceneMap().deleted(playerSpace, id)) {
				return;
			}
			this.sceneMap().add(playerSpace, id, new RenderPlayer(playerSpace, id));
			this.sceneMap().update(playerSpace, id, data);
		}

		connection.addSender(keyType, () => {
			if (this.state() !== GameState.GAME) return;

			this._keyUpdates++;
			const msg = this.snapshotKeys();
			connection.sendData(msg);
		}, frameMillis);
	}

	private updateGameState(msg : { [k: string]: any }) : void {
		const seqNum = msg.S;
		if (msg.T === objectDataType) {
			if (seqNum <= this._lastSeqNum) {
				return;
			}  else {
				this._lastSeqNum = seqNum;
			}
		}

		if (Util.defined(msg.G)) {
			if (msg.G.hasOwnProperty(objectStatesProp)) {
				this.parseObjectPropMap(msg.G[objectStatesProp], seqNum);
			}
		}

		if (Util.defined(msg.Os)) {
			this.parseObjectPropMap(msg.Os, seqNum);
		}
	}

	private parseObjectPropMap(objectPropMap : Map<number, any>, seqNum : number) {
		for (const [stringSpace, objects] of Object.entries(objectPropMap) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);

				if (this.sceneMap().deleted(space, id)) {
					continue;
				}

				if (!this.sceneMap().has(space, id)) {
					let renderObj;
					if (space === playerSpace) {
						renderObj = new RenderPlayer(space, id);
					} else if (space === explosionSpace) {
						renderObj = new RenderExplosion(space, id);
					} else if (space === boltSpace) {
						renderObj = new RenderBolt(space, id);
					} else if (space === rocketSpace) {
						renderObj = new RenderRocket(space, id);
					} else if (space === paperStarSpace) {
						renderObj = new RenderPaperStar(space, id);
					} else if (space === pickupSpace) {
						renderObj = new RenderPickup(space, id);
					} else {
						// TODO: add bomb
						console.error("Unable to construct object for type " + space);
						continue;
					}
					this.sceneMap().add(space, id, renderObj);
				}

				this.sceneMap().update(space, id, object, seqNum);
			}
		}
	}

	private extrapolateState() {
		if (!options.clientPrediction) {
			return;
		}

		// Update key presses.
		if (this.sceneMap().has(playerSpace, this._id)) {
			const keyMsg = this.snapshotKeys();
			keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
			wasmUpdateKeys(this._id, keyMsg.Key);
		}

		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this.sceneMap().has(space, id)) {
					console.error("Extrapolated nonexistent object: " + space + " " + id);
					continue;
				}

				this.sceneMap().update(space, id, object);
			}
		}
	}

	private extrapolatePlayerDir() : void {
		if (this.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();
	   		const player : any = this.sceneMap().get(playerSpace, this._id);

	   		const playerPos = player.pos();
	   		const dir = new THREE.Vector2(mouse.x - playerPos.x, mouse.y - playerPos.y);
	   		dir.normalize();

	   		const weaponPos = player.weaponPos();
	   		const weaponDir = new THREE.Vector2(mouse.x - weaponPos.x, mouse.y - weaponPos.y);
	   		weaponDir.normalize();

	   		player.setDir(dir);
	   		player.setWeaponDir(weaponDir);
		}
	}

	private initLevel(msg : { [k: string]: any }) : void {
		this.sceneMap().clearObjects();

		const level = JSON.parse(wasmLoadLevel(msg.L));

		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);

				const wall = new RenderWall(space, id);
				this.sceneMap().add(space, id, wall);
				this.sceneMap().update(space, id, object, 0);
			}
		}
	}

	private updateCamera() : void {
		if (!this.hasId()) return;
		if (!this.sceneMap().has(playerSpace, this._id)) return;

		const playerPos = this.sceneMap().get(playerSpace, this._id).pos();
		renderer.setCameraTarget(new THREE.Vector3(playerPos.x, playerPos.y, 0));

		const panEnabled = renderer.cameraController().panEnabled();
		if (!panEnabled && this.keyDown(altMouseClick)) {
			const mouseScreen = renderer.getMouseScreen();
			let pan = new THREE.Vector3(mouseScreen.x, mouseScreen.y, 0);
			pan.normalize();
			pan.multiplyScalar(8);
			renderer.cameraController().enablePan(pan);
		} else if (panEnabled && !this.keyDown(altMouseClick)) {
			renderer.cameraController().disablePan();
		}
	}
}

export const game = new Game();