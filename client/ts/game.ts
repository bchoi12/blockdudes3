import * as THREE from 'three';

import { Model, loader } from './loader.js'
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
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );
	private readonly _bombMaterial = new THREE.MeshStandardMaterial( {color: 0x4444bb, transparent: true, opacity: 0.5} );

	private _id : number;

	private _sceneMap : SceneMap;
	private _keyUpdates : number;
	private _animateFrames : number;

	constructor() {
		this._sceneMap = new SceneMap();
		this._keyUpdates = 0;
		this._animateFrames = 0;
	}

	setup() : void {
		connection.addHandler(gameStateType, (msg : { [k: string]: any }) => { this.updateGameState(msg); });
		connection.addHandler(gameUpdateType, (msg : { [k: string]: any }) => { this.updateGameState(msg); })
		connection.addHandler(playerInitType, (msg : { [k: string]: any }) => { this.initPlayer(msg); });
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
		this.sceneMap().updateComponents(renderer.cameraTarget())
		this.updateCamera();
		this.extrapolatePlayerDir();
		renderer.render();

		requestAnimationFrame(() => { this.animate(); });
		this._animateFrames++;
	}

	private createKeyMsg() : { [k: string]: any } {
		const msg = ui.createKeyMsg(this._keyUpdates);

		if (this.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();

	   		// TODO: this is slightly off since we're using pos instead of weapon pos
	   		const player = this.sceneMap().get(playerSpace, this._id).pos();
	   		const dir = new THREE.Vector2(mouse.x - player.x, mouse.y - player.y);

	   		dir.normalize();
			msg.Key.D = {
				X: dir.x,
				Y: dir.y,
			};
		}
		return msg;
	}

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
	}

	private updateGameState(msg : { [k: string]: any }) : void {
		const seqNum = msg.S;
		if (Util.defined(msg.Os)) {
			for (const [stringSpace, objects] of Object.entries(msg.Os) as [string, any]) {
				for (const [stringId, object] of Object.entries(objects) as [string, any]) {
					const space = Number(stringSpace);
					const id = Number(stringId);

					if (this.sceneMap().deleted(space, id)) {
						continue;
					}

					if (!this.sceneMap().has(space, id)) {
						let renderObj;
						if (space === explosionSpace) {
							renderObj = new RenderExplosion(space, id);
						} else if (space === rocketSpace) {
							renderObj = new RenderProjectile(space, id);
						} else {
							// TODO: add bomb
							// TODO: add platforms & walls?
							console.error("Unable to construct object for type " + space);
							continue;
						}
						this.sceneMap().add(space, id, renderObj);
					}

					this.sceneMap().update(space, id, object, seqNum);
				}
			}
		}

		if (Util.defined(msg.Ps)) {
			for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
				const id = Number(stringId);

				if (this.sceneMap().deleted(playerSpace, id)) {
					continue;
				}

				if (!this.sceneMap().has(playerSpace, id)) {
					this.sceneMap().add(playerSpace, id, new RenderPlayer(playerSpace, id));
				}

				this.sceneMap().update(playerSpace, id, player, seqNum);
			}
		}

		if (Util.defined(msg.Ss)) {
			if (msg.Ss.length > 0) {
				this.sceneMap().renderShots(msg.Ss);
			}	
		}
	}

	private extrapolateState() {
		// Update key presses.
		if (this.sceneMap().has(playerSpace, this._id)) {
			const keyMsg = this.createKeyMsg();
			keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
			wasmUpdateKeys(this._id, keyMsg.Key);
		}

		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this.sceneMap().has(space, id)) continue;

				this.sceneMap().update(space, id, object);
			}
		}

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!this.sceneMap().has(playerSpace, id)) continue;

			this.sceneMap().update(playerSpace, id, player);
		}
	}

	private extrapolatePlayerDir() : void {
		if (this.sceneMap().has(playerSpace, this._id)) {
	   		const mouse = renderer.getMouseWorld();
	   		const playerPos = this.sceneMap().get(playerSpace, this._id).pos();

	   		const dir = new THREE.Vector2(mouse.x - playerPos.x, mouse.y - playerPos.y);
	   		dir.normalize();

	   		// TODO: fix weapon dir
	   		const player : any = this.sceneMap().get(playerSpace, this._id)
	   		player.setDir(dir, dir.clone());
		}
	}

	private initLevel(msg :any) : void {
		this.sceneMap().clearObjects();

		const level = JSON.parse(wasmLoadLevel(msg.L));

		for (const [stringSpace, objects] of Object.entries(level.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				const mesh = new THREE.Mesh(new THREE.BoxGeometry(object[dimProp].X, object[dimProp].Y, 5.0), this._objectMaterial);	
				mesh.castShadow = true;
				mesh.receiveShadow = true;

				// TODO: need an object for this
				const renderObj = new RenderObject(space, id);
				renderObj.setMesh(mesh);
				this.sceneMap().add(space, id, renderObj);
				this.sceneMap().update(space, id, object);
			}
		}
	}

	private updateCamera() : void {
		if (!Util.defined(this._id)) return;
		if (!this.sceneMap().has(playerSpace, this._id)) return;

		const playerPos = this.sceneMap().get(playerSpace, this._id).pos();
		renderer.setCameraTarget(new THREE.Vector3(playerPos.x, playerPos.y, 0));
	}
}

export const game = new Game();