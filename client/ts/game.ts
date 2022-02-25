import * as THREE from 'three';

import { Model, Loader } from './loader.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { RenderWeapon } from './render_weapon.js'
import { GameUtil, Util } from './util.js'

import { connection } from './connection.js'
import { renderer } from './renderer.js'
import { ui } from './ui.js'

class Game {
	private readonly _statsInterval = 500;
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444 } );
	private readonly _bombMaterial = new THREE.MeshStandardMaterial( {color: 0x4444bb, transparent: true, opacity: 0.5} );
	
	private _loader : Loader;

	private _id : number;
	private _keyUpdates : number;
	private _lastGameUpdate : number;
	private _lastGameUpdateTime : number;
	private _animateFrames : number;

	private _currentPlayerData : any;
	private _currentObjects : Set<string>

	constructor() {
		this._objectMaterial.shadowSide = THREE.FrontSide;

		this._loader = new Loader();

		this._keyUpdates = 0;
		this._lastGameUpdate = 0;
		this._lastGameUpdateTime = Date.now();
		this._animateFrames = 0;

		this._currentObjects = new Set();
	}

	setup() : void {
		connection.addHandler(gameStateType, (msg : any) => { this.updateGameState(msg); });
		connection.addHandler(playerInitType, (msg : any) => { this.updatePlayers(msg); });
		connection.addHandler(playerJoinType, (msg : any) => { this.updatePlayers(msg); });
		connection.addHandler(leftType, (msg : any) => { this.updatePlayers(msg); });
		connection.addHandler(levelInitType, (msg : any) => { this.initLevel(msg); });
	}

	start() : void {
		connection.addSender(keyType, () => {
			if (!Util.defined(this._id)) return;

			this._keyUpdates++;
			const msg = ui.createKeyMsg(this._keyUpdates);
			connection.sendData(msg);
		}, frameMillis);

		this.animate();

		const self = this;
		function updateStats() {
			const ping = connection.ping();
			const fps = self._animateFrames * 1000 / self._statsInterval;
			ui.updateStats(ping, fps);

			self._animateFrames = 0;
			setTimeout(updateStats, self._statsInterval);		
		}
		updateStats();
	}

	private animate() : void {
		this.extrapolateState();
		this.updateCamera();
		renderer.render();

		requestAnimationFrame(() => { this.animate(); });
		this._animateFrames++;
	}

	private addPlayer(id : number, data : any) {
		if (wasmHas(playerSpace, id)) return;

		this._loader.load(Model.CHICKEN, (mesh : THREE.Mesh) => {
			const playerMesh = mesh.getObjectByName("mesh");
			// Model origin is at feet
			playerMesh.position.y -= data[dimProp].Y / 2;

			const player = new RenderPlayer(mesh);
			const pos = data[posProp];
			player.mesh().position.x = pos.X;
			player.mesh().position.y = pos.Y;

			renderer.sceneMap().add(playerSpace, id, player);
			wasmAdd(playerSpace, id, data);

			this._loader.load(Model.UZI, (weaponMesh : THREE.Mesh) => {
				player.setWeapon(new RenderWeapon(weaponMesh));
			});
		});
	}

	private deletePlayer(id : number) {
		renderer.sceneMap().delete(playerSpace, id);
		wasmDelete(playerSpace, id);
	}

	private updatePlayers(msg : any) : void {
		switch(msg.T) {
			case playerInitType:
				this._id = msg.Id
				for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
					const id = Number(stringId);
					this.addPlayer(id, player);
				}
				break;
			case playerJoinType:
				for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
					const id = Number(stringId);
					this.addPlayer(id, player);
				}
				break;
			case leftType:
				this.deletePlayer(msg.Client.Id);
				break;
		}
	}

	private updateGameState(msg : any) : void {
		if (this._lastGameUpdate >= msg.S) return;

		const deleteObjects = new Set(this._currentObjects);
		for (const [stringSpace, objects] of Object.entries(msg.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);

				if (!wasmHas(space, id)) {
					wasmAdd(space, id, object);
					const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._bombMaterial);
					mesh.rotation.x = Math.random() * Math.PI;	
					mesh.rotation.y = Math.random() * Math.PI;	
					mesh.rotation.z = Math.random() * Math.PI;	
					mesh.receiveShadow = true;

					const renderObj = new RenderObject(mesh);

					this._currentObjects.add(GameUtil.sid(space, id));
					renderer.sceneMap().add(space, id, renderObj);
				}
				deleteObjects.delete(GameUtil.sid(space, id));

				this.sanitizeData(object);
				wasmSetData(space, id, object);
				renderer.sceneMap().update(space, id, object);
			}
		}

		// Haven't seen these objects so delete them.
		deleteObjects.forEach((sid) => {
			this._currentObjects.delete(sid);
			renderer.sceneMap().delete(GameUtil.space(sid), GameUtil.id(sid));
			wasmDelete(GameUtil.space(sid), GameUtil.id(sid));
		});

		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			if (!wasmHas(playerSpace, id)) continue;

			if (id === this._id) {
				this._currentPlayerData = player;
			}

			this.sanitizePlayerData(player);
			wasmSetData(playerSpace, id, player);
			renderer.sceneMap().update(playerSpace, id, player);
		}

		if (msg.Ss.length > 0) {
			renderer.sceneMap().renderShots(msg.Ss);
		}

		this._lastGameUpdate = msg.S;
		this._lastGameUpdateTime = Date.now();
	}

	private extrapolateState() {
		if (Util.defined(this._id)) {
			const keyMsg = ui.createWasmKeyMsg(this._keyUpdates);
			wasmUpdateKeys(this._id, keyMsg);
		}

		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!renderer.sceneMap().has(space, id)) continue;

				renderer.sceneMap().update(space, id, object);
			}
		}

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!renderer.sceneMap().has(playerSpace, id)) continue;

			if (id != this._id || !Util.defined(this._currentPlayerData)) {
				renderer.sceneMap().update(playerSpace, id, player);
			} else {
				renderer.sceneMap().update(playerSpace, id, this.interpolateState(this._currentPlayerData, player));
			}
		}
	}

	private interpolateState(currentData : any, nextData : any) : any {
		const millisElapsed = Date.now() - this._lastGameUpdateTime;
		const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;

		const data = nextData;
		data[posProp] = this.interpolateVec2(currentData[posProp], nextData[posProp], weight);
		if (currentData.hasOwnProperty(velProp) && nextData.hasOwnProperty(velProp)) {
			data[velProp] = this.interpolateVec2(currentData[velProp], nextData[velProp], weight);
		}
		if (currentData.hasOwnProperty(accProp) && nextData.hasOwnProperty(accProp)) {
			data[accProp] = this.interpolateVec2(currentData[accProp], nextData[accProp], weight);
		}
		return data;
	}

	private interpolateVec2(current : any, next : any, weight : number) : any {
		const vec = current;
		vec.X = current.X * (1 - weight) + next.X * weight;
		vec.Y = current.Y * (1 - weight) + next.Y * weight;
		return vec;
	}

	private sanitizeData(data : any) : void {
		return;
	}

	private sanitizePlayerData(data : any) : void {
		this.sanitizeData(data);

		if (data.hasOwnProperty(keysProp)) {
			const keys = Object.keys(data[keysProp]);
			if (keys.length > 0) {
				data[keysProp] = Util.arrayToString(keys);
			}
		}
	}

	private initLevel(msg :any) : void {
		this._currentObjects.clear();
		renderer.sceneMap().clearObjects();

		const level = JSON.parse(wasmLoadLevel(msg.L));

		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				const mesh = new THREE.Mesh(new THREE.BoxGeometry(object[dimProp].X, object[dimProp].Y, 5.0), this._objectMaterial);	
				mesh.castShadow = true;
				mesh.receiveShadow = true;

				const renderObj = new RenderObject(mesh);
				mesh.position.x = object[posProp].X;
				mesh.position.y = object[posProp].Y;
				renderer.sceneMap().add(space, id, renderObj);
			}
		}
	}

	private updateCamera() : void {
		if (!Util.defined(this._id)) return;
		if (!renderer.sceneMap().has(playerSpace, this._id)) return;

		const playerRender = renderer.sceneMap().get(playerSpace, this._id);
		renderer.setCamera(playerRender.mesh().position);
	}
}

export const game = new Game();