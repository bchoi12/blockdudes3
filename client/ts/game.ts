import * as THREE from 'three';

import { Model, Loader } from './loader.js'
import { RenderObject } from './render_object.js'
import { RenderExplosion } from './render_explosion.js'
import { RenderPlayer } from './render_player.js'
import { RenderProjectile } from './render_projectile.js'
import { RenderWeapon } from './render_weapon.js'
import { SceneMap } from './scene_map.js'
import { GameUtil, Util } from './util.js'

import { connection } from './connection.js'
import { renderer } from './renderer.js'
import { ui } from './ui.js'

class Game {
	private readonly _statsInterval = 500;
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444 } );
	private readonly _explosionMaterial = new THREE.MeshStandardMaterial( {color: 0xbb4444 } );
	private readonly _bombMaterial = new THREE.MeshStandardMaterial( {color: 0x4444bb, transparent: true, opacity: 0.5} );

	private _sceneMap : SceneMap;
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

		this._sceneMap = new SceneMap();
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
			const msg = this.createKeyMsg();
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

	sceneMap() : SceneMap {
		return this._sceneMap;
	}

	private animate() : void {
		this.extrapolateState();
		this.updateCamera();
		this._sceneMap.updateComponents(renderer.cameraTarget())
		this.extrapolatePlayerDir();
		renderer.render();

		requestAnimationFrame(() => { this.animate(); });
		this._animateFrames++;
	}

	private createKeyMsg() : any {
		const msg = ui.createKeyMsg(this._keyUpdates);

		if (game.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();
	   		const player = game.sceneMap().get(playerSpace, this._id).pos();

	   		// TODO: this is slightly off
	   		const dir = new THREE.Vector2(mouse.x - player.x, mouse.y - player.y);
	   		dir.normalize();
			msg.Key.D = {
				X: dir.x,
				Y: dir.y,
			};
		}
		return msg;
	}

	private addPlayer(id : number, data : any) {
		if (wasmHas(playerSpace, id)) return;

		const player = new RenderPlayer(playerSpace, id);
		game.sceneMap().add(playerSpace, id, player);
		game.sceneMap().update(playerSpace, id, data);
		wasmAdd(playerSpace, id, data);

		this._loader.load(id % 2 == 0 ? Model.CHICKEN : Model.DUCK, (mesh : THREE.Mesh) => {
			// Model origin is at feet
			mesh.getObjectByName("mesh").position.y -= data[dimProp].Y / 2;
			player.setMesh(mesh);

			this._loader.load(Model.UZI, (weaponMesh : THREE.Mesh) => {
				const weapon = new RenderWeapon();
				weapon.setMesh(weaponMesh);
				player.setWeapon(weapon);
			});
		});
	}

	private deletePlayer(id : number) {
		game.sceneMap().delete(playerSpace, id);
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

					this._currentObjects.add(GameUtil.sid(space, id));

					let renderObj;
					if (space === explosionSpace) {
						const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._explosionMaterial);
						mesh.receiveShadow = true;
						renderObj = new RenderExplosion(space, id);
						renderObj.setMesh(mesh);
					} else if (space === rocketSpace) {
						renderObj = new RenderProjectile(space, id);
						this._loader.load(Model.ROCKET, (mesh : THREE.Mesh) => {
							renderObj.setMesh(mesh);
						});
					} else if (space === bombSpace) {
						const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._bombMaterial);
						mesh.rotation.x = Math.random() * Math.PI;	
						mesh.rotation.y = Math.random() * Math.PI;	
						mesh.rotation.z = Math.random() * Math.PI;	
						mesh.receiveShadow = true;
						renderObj = new RenderObject(space, id);
						renderObj.setMesh(mesh);
					} else {
						const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._bombMaterial);
						mesh.receiveShadow = true;
						renderObj = new RenderObject(space, id);
						renderObj.setMesh(mesh);
					}
					game.sceneMap().add(space, id, renderObj);
				}
				deleteObjects.delete(GameUtil.sid(space, id));

				this.sanitizeData(object);
				wasmSetData(space, id, object);
				game.sceneMap().update(space, id, object);
			}
		}

		// Haven't seen these objects so delete them.
		deleteObjects.forEach((sid) => {
			this._currentObjects.delete(sid);
			game.sceneMap().delete(GameUtil.space(sid), GameUtil.id(sid));
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
			game.sceneMap().update(playerSpace, id, player);
		}

		if (msg.Ss.length > 0) {
			game.sceneMap().renderShots(msg.Ss);
		}

		this._lastGameUpdate = msg.S;
		this._lastGameUpdateTime = Date.now();
	}

	private extrapolateState() {
		// Update key presses.
		if (game.sceneMap().has(playerSpace, this._id)) {
			const keyMsg = this.createKeyMsg();
			keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
			wasmUpdateKeys(this._id, keyMsg.Key);
		}

		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!game.sceneMap().has(space, id)) continue;

				game.sceneMap().update(space, id, object);
			}
		}

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!game.sceneMap().has(playerSpace, id)) continue;

			if (id != this._id || !Util.defined(this._currentPlayerData)) {
				game.sceneMap().update(playerSpace, id, player);
			} else {
				game.sceneMap().update(playerSpace, id, this.interpolateState(this._currentPlayerData, player));
			}
		}
	}

	private extrapolatePlayerDir() : void {
		if (game.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();
	   		const player = game.sceneMap().get(playerSpace, this._id).pos();

	   		const dir = new THREE.Vector2(mouse.x - player.x, mouse.y - player.y);
	   		dir.normalize();

	   		// TODO: fix weapon dir
	   		game.sceneMap().get(playerSpace, this._id).setDir(dir, dir.clone());
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
		game.sceneMap().clearObjects();

		const level = JSON.parse(wasmLoadLevel(msg.L));

		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				const mesh = new THREE.Mesh(new THREE.BoxGeometry(object[dimProp].X, object[dimProp].Y, 5.0), this._objectMaterial);	
				mesh.castShadow = true;
				mesh.receiveShadow = true;

				const renderObj = new RenderObject(space, id);
				renderObj.setMesh(mesh);
				game.sceneMap().add(space, id, renderObj);
				game.sceneMap().update(space, id, object);
			}
		}
	}

	private updateCamera() : void {
		if (!Util.defined(this._id)) return;
		if (!game.sceneMap().has(playerSpace, this._id)) return;

		const playerPos = game.sceneMap().get(playerSpace, this._id).pos()
		renderer.setCameraTarget(new THREE.Vector3(playerPos.x, playerPos.y, 0));
	}
}

export const game = new Game();