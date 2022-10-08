import * as THREE from 'three';

import { connection } from './connection.js'
import { Keys } from './keys.js'
import { Model, loader } from './loader.js'
import { options } from './options.js'
import { Particles } from './particles.js'
import { RenderBlock } from './render_block.js'
import { RenderBolt } from './render_bolt.js'
import { RenderEquip } from './render_equip.js'
import { RenderExplosion } from './render_explosion.js'
import { RenderGrapplingHook } from './render_grappling_hook.js'
import { RenderLight } from './render_light.js'
import { RenderObject } from './render_object.js'
import { RenderPellet } from './render_pellet.js'
import { RenderPickup } from './render_pickup.js'
import { RenderPlayer } from './render_player.js'
import { RenderPortal } from './render_portal.js'
import { RenderRocket } from './render_rocket.js'
import { RenderStar } from './render_star.js'
import { RenderWall } from './render_wall.js'
import { RenderWeapon } from './render_weapon.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { SceneMap } from './scene_map.js'
import { ui, TooltipType } from './ui.js'
import { LogUtil, Util } from './util.js'

export enum GameInputMode {
	UNKNOWN = 0,
	PAUSED = 1,
	GAME = 2,
}

class Game {
	private _id : number;
	private _state : number;
	private _inputMode : GameInputMode;

	// TODO: move to SceneMap
	private _timeOfDay : number;
	private _updateSpeed : number;

	private _sceneMap : SceneMap;
	private _teamScores : Map<number, number>;
	private _keys : Keys;
	private _keySeqNum : number;
	private _lastSeqNum : number;
	private _lastStateUpdate : number;

	private _numObjectsAdded : number;
	private _numObjectsExtrapolated: number;
	private _numUpdates : number;

	constructor() {
		this._id = -1;
		this._state = 0;
		this._inputMode = GameInputMode.PAUSED;
		this._timeOfDay = 0;
		this._updateSpeed = 1;

		this._sceneMap = new SceneMap();
		this._teamScores = new Map<number, number>();
		this._keys = new Keys();
		this._keySeqNum = 0;
		this._lastSeqNum = 0;
		this._lastStateUpdate = Date.now();

		this._numObjectsAdded = 0;
		this._numObjectsExtrapolated = 0;
		this._numUpdates = 0;
	}

	reset() : void {
		wasmReset();
		this._sceneMap.clearAll();
	}

	setup() : void {
		this._sceneMap.setup();

		connection.addHandler(objectDataType, (msg : { [k: string]: any }) => { this.update(msg); });
		connection.addHandler(objectUpdateType, (msg : { [k: string]: any }) => { this.update(msg); });
		connection.addHandler(playerInitType, (msg : { [k: string]: any }) => { this.initPlayer(msg); });
		connection.addHandler(levelInitType, (msg : { [k: string]: any }) => { this.initLevel(msg); });
	}

	hasId() : boolean { return this._id >= 0; }
	id() : number { return this._id; }
	player() : RenderPlayer { return <RenderPlayer>this._sceneMap.get(playerSpace, this.id()); }
	state() : number { return this._state; }
	inputMode() : GameInputMode { return this._inputMode; }
	timeOfDay() : number { return this._timeOfDay; }
	updateSpeed() : number { return this._updateSpeed; }
	sceneMap() : SceneMap { return this._sceneMap; }

	keys() : Keys { return this._keys; }

	particles() : Particles { return this._sceneMap.getComponentAsAny(SceneComponentType.PARTICLES); }
	sceneComponent(type : SceneComponentType) : SceneComponent { return this._sceneMap.getComponent(type); }

	startRender() : void { this.animate(); }
	setInputMode(inputMode : GameInputMode) { this._inputMode = inputMode; }
	setTimeOfDay(timeOfDay : number) { this._timeOfDay = timeOfDay; }

	flushAdded() : number {
		const copy = this._numObjectsAdded;
		this._numObjectsAdded = 0;
		return copy;
	}

	flushExtrapolated() : number {
		const copy = this._numObjectsExtrapolated;
		this._numObjectsExtrapolated = 0;
		return copy;
	}

	flushUpdated() : number {
		const copy = this._numUpdates;
		this._numUpdates = 0;
		return copy;
	}

	private animate() : void {
		if (this.inputMode() === GameInputMode.GAME) {
			this._keys.snapshotKeys();
			this.extrapolateState();
		}
		this.sceneMap().update()

		if (this.inputMode() === GameInputMode.GAME) {
			this.updateCamera();
			this.extrapolatePlayer();
			this.sceneMap().postCameraUpdate()
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
			if (this.inputMode() !== GameInputMode.GAME || !connection.ready()) return;

			this._keySeqNum++;
			const msg = this._keys.keyMsg(this._keySeqNum);
			connection.sendData(msg);
			if (this._keys.changed()) {
				connection.send(msg);
			}
		}, frameMillis);

		this.setInputMode(GameInputMode.GAME);
		ui.tooltip({
			type: TooltipType.HELLO,
			ttl: 5000,
		})
		LogUtil.d("Initializing player with id " + this._id);
	}

	private update(msg : { [k: string]: any }) : void {
		const seqNum = msg.S;
		if (msg.T === objectDataType) {
			if (seqNum <= this._lastSeqNum) {
				return;
			} else {
				this._lastStateUpdate = Date.now();
				this._lastSeqNum = seqNum;
			}
		} else {
			if (Util.defined(msg.G)) {
				this.parseGameInputMode(msg.G);
			}
		}

		if (Util.defined(msg.Os)) {
			this.parseObjectPropMap(msg.Os, seqNum);
		}
	}

	private parseGameInputMode(gameState : Object) : void {
		[1, 2].forEach((i) => {
			if (gameState.hasOwnProperty(i)) {
				const team = gameState[i];
				if (team.hasOwnProperty(scoreProp)) {
					this._teamScores[i] = team[scoreProp];
				}
			}
		})

		if (gameState.hasOwnProperty(0)) {
			const system = gameState[0];
			if (system.hasOwnProperty(stateProp)) {
				this._state = system[stateProp];
				if (this._state === victoryGameState) {
					// TODO: make this wasm variable
					this._updateSpeed = 0.3;
					ui.announce({
						enabled: true,
						text: this._teamScores[1] + " - " + this._teamScores[2],
					});
				} else {
					this._updateSpeed = 1.0;
					ui.announce({ enabled: false });
				}
			}
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
					} else if (space === lightSpace) {
						renderObj = new RenderLight(space, id);
					} else if (space === equipSpace) {
						renderObj = new RenderEquip(space, id);
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
					} else if (space === portalSpace || space === goalSpace) {
						renderObj = new RenderPortal(space, id);
					} else if (space === spawnSpace) {
						renderObj = new RenderObject(space, id);
					}else {
						console.error("Unable to construct object for type " + space);
						continue;
					}
					this.sceneMap().add(space, id, renderObj);
					this._numObjectsAdded++;
				}

				this.sceneMap().setData(space, id, object, seqNum);
				this._numUpdates++;
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
		if (options.extrapolateWeight === 0) {
			return;
		}

		this.sceneMap().snapshotWasm();
		const state = JSON.parse(wasmUpdate());
		if (state.length === 0 || !Util.defined(state.Os)) {
			LogUtil.d("Failed to extrapolate objects");
			return;
		}

		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this.sceneMap().has(space, id)) {
					continue;
				}

				this.sceneMap().setData(space, id, object);
				this._numObjectsExtrapolated++;
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
	}

	private updateCamera() : void {
		if (!this.hasId()) return;
		if (!this.sceneMap().has(playerSpace, this.id())) return;

		let camera = renderer.cameraController();
		const player : RenderPlayer = this.sceneMap().getAsAny(playerSpace, this.id());
		camera.setObject(player);
	}
}

export const game = new Game();