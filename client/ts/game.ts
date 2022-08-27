import * as THREE from 'three';

import { connection } from './connection.js'
import { Keys } from './keys.js'
import { Model, loader } from './loader.js'
import { options } from './options.js'
import { RenderBlock } from './render_block.js'
import { RenderBolt } from './render_bolt.js'
import { RenderExplosion } from './render_explosion.js'
import { RenderGrapplingHook } from './render_grappling_hook.js'
import { RenderObject } from './render_object.js'
import { RenderPellet } from './render_pellet.js'
import { RenderPickup } from './render_pickup.js'
import { RenderPlayer } from './render_player.js'
import { RenderRocket } from './render_rocket.js'
import { RenderStar } from './render_star.js'
import { RenderWall } from './render_wall.js'
import { RenderWeapon } from './render_weapon.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { SceneMap } from './scene_map.js'
import { ui } from './ui.js'
import { LogUtil, Util } from './util.js'

export enum GameState {
	UNKNOWN = 0,
	PAUSED = 1,
	GAME = 2,
}

class Game {
	private readonly _statsInterval = 500;
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );

	private _id : number;
	private _state : GameState;
	private _timeOfDay : number;

	private _sceneMap : SceneMap;
	private _keys : Keys;
	private _keySeqNum : number;
	private _lastSeqNum : number;
	private _lastStateUpdate : number;

	private _numObjectsAdded : number;
	private _numObjectsUpdated : number;

	constructor() {
		this._id = -1;
		this._state = GameState.PAUSED;
		this._timeOfDay = 0;

		this._sceneMap = new SceneMap();
		this._keys = new Keys();
		this._keySeqNum = 0;
		this._lastSeqNum = 0;
		this._lastStateUpdate = Date.now();

		this._numObjectsAdded = 0;
		this._numObjectsUpdated = 0;
	}

	reset() : void {
		wasmReset();
		this._sceneMap.clearAll();
	}

	setup() : void {
		this._sceneMap.setup();

		connection.addHandler(objectDataType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(objectUpdateType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(playerInitType, (msg : { [k: string]: any }) => { this.initPlayer(msg); });
		connection.addHandler(levelInitType, (msg : { [k: string]: any }) => { this.initLevel(msg); });
	}

	hasId() : boolean { return this._id >= 0; }
	id() : number { return this._id; }
	state() : GameState { return this._state; }
	timeOfDay() : number { return this._timeOfDay; }
	sceneMap() : SceneMap { return this._sceneMap; }
	sceneComponent(type : SceneComponentType) : SceneComponent { return this._sceneMap.getComponent(type); }

	startRender() : void { this.animate(); }
	setState(state : GameState) { this._state = state; }
	setTimeOfDay(timeOfDay : number) { this._timeOfDay = timeOfDay; }

	flushAdded() : number {
		const copy = this._numObjectsAdded;
		this._numObjectsAdded = 0;
		return copy;
	}

	flushUpdated() : number {
		const copy = this._numObjectsUpdated;
		this._numObjectsUpdated = 0;
		return copy;
	}

	private animate() : void {
		if (this.state() === GameState.GAME) {
			this._keys.snapshotKeys();
			this.extrapolateState();
		}
		this.sceneMap().update()

		if (this.state() === GameState.GAME) {
			this.updateCamera();
			this.extrapolatePlayer();
		}
		renderer.render();
		requestAnimationFrame(() => { this.animate(); });
	}

	private initPlayer(msg : { [k: string]: any }) : void {
		this._id = msg.Id;
		for (const [stringId, data] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			if (this.sceneMap().has(playerSpace, id) || this.sceneMap().deleted(playerSpace, id)) {
				LogUtil.w("Scene map already contains initialized or deleted player!");
				return;
			}
			this.sceneMap().add(playerSpace, id, new RenderPlayer(playerSpace, id));
			this.sceneMap().setData(playerSpace, id, data);
		}

		connection.addSender(keyType, () => {
			if (this.state() !== GameState.GAME || !connection.ready()) return;

			this._keySeqNum++;
			const msg = this._keys.keyMsg(this._keySeqNum);
			connection.sendData(msg);
			if (this._keys.changed()) {
				connection.send(msg);
			}
		}, frameMillis);

		this.setState(GameState.GAME);
		LogUtil.d("Initializing player with id " + this._id);
	}

	private updateGameState(msg : { [k: string]: any }) : void {
		const seqNum = msg.S;
		if (msg.T === objectDataType) {
			if (seqNum <= this._lastSeqNum) {
				return;
			}  else {
				this._lastStateUpdate = Date.now();
				this._lastSeqNum = seqNum;
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
					} else if (space === blockSpace) {
						renderObj = new RenderBlock(space, id);
					} else if (space === wallSpace) {
						renderObj = new RenderWall(space, id);
					} else if (space === explosionSpace) {
						renderObj = new RenderExplosion(space, id);
					} else if (space === weaponSpace) {
						renderObj = new RenderWeapon(space, id);
					} else if (space === pelletSpace) {
						renderObj = new RenderPellet(space, id);
					} else if (space === boltSpace) {
						renderObj = new RenderBolt(space, id);
					} else if (space === rocketSpace) {
						renderObj = new RenderRocket(space, id);
					} else if (space === starSpace) {
						renderObj = new RenderStar(space, id);
					} else if (space === grapplingHookSpace) {
						renderObj = new RenderGrapplingHook(space, id);
					} else if (space === pickupSpace) {
						renderObj = new RenderPickup(space, id);
					}else {
						console.error("Unable to construct object for type " + space);
						continue;
					}
					this.sceneMap().add(space, id, renderObj);
					this._numObjectsAdded++;
				}

				this.sceneMap().setData(space, id, object, seqNum);
				this._numObjectsUpdated++;
			}
		}
	}

	private updateKeys() : void {
		if (this.sceneMap().has(playerSpace, this.id())) {
			const keyMsg = this._keys.keyMsg(this._keySeqNum);
			keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
			wasmUpdateKeys(this.id(), keyMsg.Key);
		}
	}

	private extrapolateState() {
		if (!options.enableClientPrediction) {
			return;
		}
		if (Date.now() - this._lastStateUpdate <= 10) {
			return;
		}

		this.sceneMap().snapshotWasm();
		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this.sceneMap().has(space, id)) {
					continue;
				}

				this.sceneMap().setData(space, id, object);
			}
		}
	}

	private extrapolatePlayer() : void {
		if (!this.sceneMap().has(playerSpace, this.id())) {
			return;
		}
		if (!wasmHas(playerSpace, this.id())) {
			return;
		}

		let player : RenderPlayer = this.sceneMap().getAsAny(playerSpace, this.id());
		wasmSetData(playerSpace, this.id(), player.data());
		this.updateKeys();
		player.setData(JSON.parse(wasmGetData(playerSpace, this.id())));
		player.update();

		// TODO: this is sort of hacky
		if (player.hasWeapon()) {
			const weaponDir = this._keys.weaponDir();
			player.setWeaponDir(new THREE.Vector2(weaponDir.X, weaponDir.Y));
		}
	}

	private initLevel(msg : { [k: string]: any }) : void {
		LogUtil.d("Loading level " + msg.L);

		const level = JSON.parse(wasmLoadLevel(msg.L));
		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, data] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);

				const wall = new RenderWall(space, id);
				this.sceneMap().add(space, id, wall);
				this.sceneMap().setData(space, id, data, /*seqNum=*/0);
			}
		}

		this.sceneMap().initLevel();
	}

	private updateCamera() : void {
		if (!this.hasId()) return;
		if (!this.sceneMap().has(playerSpace, this.id())) return;

		const player : RenderPlayer = this.sceneMap().getAsAny(playerSpace, this.id());

		const playerPos = player.pos();
		renderer.setCameraAnchor(new THREE.Vector3(playerPos.x, playerPos.y, 0));

		// TODO: clean up
		if (player.weaponType() === sniperWeapon) {
			const panEnabled = renderer.cameraController().panEnabled();
			if (!panEnabled && this._keys.keyDown(altMouseClick)) {
				const mouseScreen = renderer.getMouseScreen();
				let pan = new THREE.Vector3(mouseScreen.x, mouseScreen.y, 0);
				pan.normalize();
				pan.multiplyScalar(10);
				renderer.cameraController().enablePan(pan);
			} else if (panEnabled && !this._keys.keyDown(altMouseClick)) {
				renderer.cameraController().disablePan();
			}
		}
	}
}

export const game = new Game();