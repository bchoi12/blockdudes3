import * as THREE from 'three';

import { connection } from './connection.js'
import { GameState } from './game_state.js'
import { Keys } from './keys.js'
import { Model, loader } from './loader.js'
import { options } from './options.js'
import { Particles } from './particles.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer, CameraMode } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { SceneMap } from './scene_map.js'
import { SpacedId } from './spaced_id.js'
import { ui, AnnouncementType, TooltipType } from './ui.js'
import { LogUtil, Util } from './util.js'

export enum GameInputMode {
	UNKNOWN = 0,
	PAUSE = 1,
	SPECTATOR = 2,
	GAME = 3,
}

class Game {
	private _id : number;
	private _state : GameState;
	private _inputMode : GameInputMode;

	// TODO: move to SceneMap
	private _timeOfDay : number;
	private _updateSpeed : number;

	private _sceneMap : SceneMap;
	private _keys : Keys;
	private _keySeqNum : number;
	private _lastSeqNum : number;
	private _lastStateUpdate : number;

	private _numObjectsAdded : number;
	private _numObjectsExtrapolated: number;
	private _numUpdates : number;

	constructor() {
		this._id = -1;
		this._state = new GameState();
		this._inputMode = GameInputMode.UNKNOWN;
		this._timeOfDay = 0;
		this._updateSpeed = 1;

		this._sceneMap = new SceneMap();
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

		connection.addHandler(gameStateType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(objectDataType, (msg : { [k: string]: any }) => { this.update(msg); });
		connection.addHandler(objectUpdateType, (msg : { [k: string]: any }) => { this.update(msg); });
		connection.addHandler(playerInitType, (msg : { [k: string]: any }) => { this.initPlayer(msg); });
		connection.addHandler(levelInitType, (msg : { [k: string]: any }) => { this.initLevel(msg); });
	}

	hasId() : boolean { return this._id >= 0; }
	id() : number { return this._id; }
	player(id? : number) : RenderPlayer { return <RenderPlayer>this._sceneMap.get(playerSpace, Util.defined(id) ? id : this.id()); }
	gameState() : GameState { return this._state; }
	state() : number { return this._state.state(); }
	inputMode() : GameInputMode { return this._inputMode; }
	timeOfDay() : number { return this._timeOfDay; }
	updateSpeed() : number { return this._updateSpeed; }
	sceneMap() : SceneMap { return this._sceneMap; }

	keys() : Keys { return this._keys; }

	particles() : Particles { return this._sceneMap.getComponentAsAny(SceneComponentType.PARTICLES); }
	sceneComponent(type : SceneComponentType) : SceneComponent { return this._sceneMap.getComponent(type); }

	setUpdateSpeed(updateSpeed : number) : void { this._updateSpeed = updateSpeed; }
	setInputMode(inputMode : GameInputMode) : void { this._inputMode = inputMode; }
	setTimeOfDay(timeOfDay : number) : void { this._timeOfDay = timeOfDay; }
	startRender() : void { this.animate(); }

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
			this.sendKeys();
			this.extrapolateState();
		}
		this.sceneMap().update()

		if (this.inputMode() === GameInputMode.GAME) {
			this.updateCamera();
			this.smoothPlayerDir();
			this.sceneMap().postCameraUpdate()
		}

		renderer.render();
		requestAnimationFrame(() => { this.animate(); });
	}

	private initPlayer(msg : { [k: string]: any }) : void {
		this._id = msg.Id;
		renderer.cameraController().setMode(CameraMode.ANY_PLAYER);
		this.setInputMode(GameInputMode.GAME);
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
		}

		if (Util.defined(msg.Os)) {
			this.parseObjectPropMap(msg.Os, seqNum);
		}
	}

	private updateGameState(msg : { [k : string]: any }) : void {
		if (!Util.defined(msg.G)) {
			return;
		}

		this._state.update(msg.G);
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
					this.sceneMap().new(space, id);
					this._numObjectsAdded++;
				}

				this.sceneMap().setData(space, id, object, seqNum);
				this._numUpdates++;
			}
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

	private smoothPlayerDir() : void {
		if (!this.sceneMap().has(playerSpace, this.id())) {
			return;
		}
		if (!wasmHas(playerSpace, this.id())) {
			return;
		}

		let player = this.player();
		if (player.attribute(deadAttribute)) {
			return;
		}

		// Don't delete this, it updates dir
		wasmSetData(playerSpace, this.id(), player.data());

		const keyMsg = this._keys.keyMsg(this._keySeqNum);
		keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
		wasmUpdateKeys(this.id(), keyMsg.Key);

		player.setData(JSON.parse(wasmGetData(playerSpace, this.id())));
		player.update();

		// more smooth bog
		if (player.hasWeapon()) { 
			const weaponDir = this._keys.weaponDir();
			player.setWeaponDir(new THREE.Vector2(weaponDir.X, weaponDir.Y));
		}
	}

	private initLevel(msg : { [k: string]: any }) : void {
		this.sceneMap().deleteIf((object : RenderObject) => {
			return object.attribute(fromLevelAttribute);
		})

		// TODO: make this announcement
		LogUtil.d("Loading level " + msg.L + " with seed " + msg.S);

		const level = JSON.parse(wasmLoadLevel(msg.L, msg.S));
		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, data] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);

				let obj = this.sceneMap().new(space, id);
				this.sceneMap().setData(space, id, data, /*seqNum=*/0);
			}
		}
	}

	private updateCamera() : void {
		if (!this.hasId()) {
			return;
		}

		const player = game.player();
		let camera = renderer.cameraController();

		if (!Util.defined(player)) {
			camera.setMode(CameraMode.ANY_PLAYER);
		} else {
			if (player.attribute(deadAttribute)) {
				camera.setMode(CameraMode.TEAM);
			} else {
				camera.setMode(CameraMode.PLAYER);
			}
		}

		if (camera.mode() === CameraMode.TEAM || camera.mode() === CameraMode.ANY_PLAYER) {
			if (this._keys.keyPressed(rightKey)) {
				camera.seek(1);
			} else if (this._keys.keyPressed(leftKey)) {
				camera.seek(-1);
			}

			const object = camera.object();
			if (Util.defined(object) && object.id() !== this.id()) {
				ui.tooltip({
					type: TooltipType.SPECTATING,
					names: [object.specialName()],
					ttl: 250,
				})
			}
		}

		camera.update();
	}

	private sendKeys() : void {
		if (!connection.ready()) {
			return;
		}
		if (!Util.defined(game.player()) || game.player().attribute(deadAttribute)) {
			return;
		}

		this._keySeqNum++;
		const keyMsg = this._keys.keyMsg(this._keySeqNum);
		connection.sendData(keyMsg);
		if (this._keys.changed()) {
			connection.send(keyMsg);
		}
	}
}

export const game = new Game();