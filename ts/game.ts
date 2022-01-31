class Game {
	private readonly _statsInterval = 500;
	private readonly _objectMaterial = new THREE.MeshStandardMaterial( {color: 0x444444 } );
	private readonly _bombMaterial = new THREE.MeshStandardMaterial( {color: 0x4444bb, transparent: true, opacity: 0.5} );
	
	private _ui : UI;
	private _renderer : Renderer;
	private _loader : Loader;
	private _connection : Connection;

	private _id : number;
	private _keyUpdates : number;
	private _lastGameUpdate : number;
	private _lastGameUpdateTime : any;
	private _animateFrames : number;

	private _currentPlayerData : any;
	private _currentObjects : Set<string>

	constructor(ui : UI, connection : Connection) {
		this._objectMaterial.shadowSide = THREE.FrontSide;

		this._ui = ui;
		this._renderer = this._ui.renderer();
		this._loader = new Loader();
		this._connection = connection;

		this._keyUpdates = 0;
		this._lastGameUpdate = 0;
		this._lastGameUpdateTime = Date.now();
		this._animateFrames = 0;

		this._currentObjects = new Set();

		this.initServerTalk();
	}

	start() : void {
		this._ui.displayGame();
		this.animate();

		const self = this;
		function updateStats() {
			const ping = self._connection.ping();
			const fps = self._animateFrames * 1000 / self._statsInterval;
			self._ui.updateStats(ping, fps);

			self._animateFrames = 0;
			setTimeout(updateStats, self._statsInterval);		
		}
		updateStats();
	}

	private animate() : void {
		this.extrapolateState();
		this.updateCamera();
		this._renderer.render();

		requestAnimationFrame(() => { this.animate(); });
		this._animateFrames++;
	}

	private initServerTalk() : void {
		this._connection.addHandler(gameStateType, (msg : any) => { this.updateGameState(msg); });
		this._connection.addHandler(playerInitType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(playerJoinType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(leftType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(levelInitType, (msg : any) => { this.initLevel(msg); });

		this._connection.addSender(keyType, () => {
			if (!defined(this._id)) return;

			this._keyUpdates++;
			const msg = this._ui.createKeyMsg(this._keyUpdates);
			this._connection.sendData(msg);
		}, frameMillis);
	}

	private addPlayer(id : number, data : any) {
		if (wasmHas(playerSpace, id)) return;

		this._loader.load(Model.CHICKEN, (mesh) => {
			const playerMesh = mesh.getObjectByName("mesh");
			// Model origin is at feet
			playerMesh.position.y -= data[dimProp].Y / 2;

			const player = new RenderPlayer(mesh);
			const pos = data[posProp];
			player.mesh().position.x = pos.X;
			player.mesh().position.y = pos.Y;

			this._renderer.scene().add(playerSpace, id, player);
			wasmAdd(playerSpace, id, data);

			this._loader.load(Model.UZI, (weaponMesh) => {
				player.setWeapon(new RenderWeapon(weaponMesh));
			});
		});
	}

	private deletePlayer(id : number) {
		this._renderer.scene().delete(playerSpace, id);
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

					this._currentObjects.add(sid(space, id));
					this._renderer.scene().add(space, id, renderObj);
				}
				deleteObjects.delete(sid(space, id));

				this.sanitizeData(object);
				wasmSetData(space, id, object);
				this._renderer.scene().update(space, id, object);
			}
		}

		// Haven't seen these objects so delete them.
		deleteObjects.forEach((sid) => {
			this._currentObjects.delete(sid);
			this._renderer.scene().delete(space(sid), id(sid));
			wasmDelete(space(sid), id(sid));
		});

		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			if (!wasmHas(playerSpace, id)) continue;

			if (id === this._id) {
				this._currentPlayerData = player;
			}

			this.sanitizePlayerData(player);
			wasmSetData(playerSpace, id, player);
			this._renderer.scene().update(playerSpace, id, player);
		}

		if (msg.Ss.length > 0) {
			this._renderer.scene().renderShots(msg.Ss);
		}

		this._lastGameUpdate = msg.S;
		this._lastGameUpdateTime = Date.now();
	}

	private extrapolateState() {
		if (defined(this._id)) {
			const keyMsg = this._ui.createWasmKeyMsg(this._keyUpdates);
			wasmUpdateKeys(this._id, keyMsg);
		}

		const state = JSON.parse(wasmUpdateState());
		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this._renderer.scene().has(space, id)) continue;

				this._renderer.scene().update(space, id, object);
			}
		}

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!this._renderer.scene().has(playerSpace, id)) continue;

			if (id != this._id || !defined(this._currentPlayerData)) {
				this._renderer.scene().update(playerSpace, id, player);
			} else {
				this._renderer.scene().update(playerSpace, id, this.interpolateState(this._currentPlayerData, player));
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
				data[keysProp] = arrayToString(keys);
			}
		}
	}

	private initLevel(msg :any) : void {
		this._currentObjects.clear();
		this._renderer.scene().clearObjects();

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
				this._renderer.scene().add(space, id, renderObj);
			}
		}
	}

	private updateCamera() : void {
		if (!defined(this._id)) return;
		if (!this._renderer.scene().has(playerSpace, this._id)) return;

		const playerRender = this._renderer.scene().get(playerSpace, this._id);
		const adj = new THREE.Vector3();
		this._renderer.setCamera(playerRender.mesh().position, adj);
	}
}