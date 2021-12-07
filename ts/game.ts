enum GameState {
	UNKNOWN = 0,
}

class Game {
	private readonly _statsInterval = 500;

	private readonly _extendCameraXThreshold = 0.8;
	private readonly _extendCameraYThreshold = 0.8;
	private readonly _extendCameraX = 0.0;
	private readonly _extendCameraY = 0.0;

	private readonly _meMaterial = new THREE.MeshToonMaterial( { color: 0xff0000 } );
	private readonly _otherMaterial = new THREE.MeshToonMaterial( { color: 0x00ff00 } );
	private readonly _objectMaterial = new THREE.MeshToonMaterial( {color: 0x777777 } );
	private readonly _bombMaterial = new THREE.MeshToonMaterial( {color: 0x7777ff, wireframe: true } );
	
	private _ui : UI;
	private _renderer : Renderer;
	private _connection : Connection;

	private _id : number;
	private _keyUpdates : number;
	private _lastGameUpdate : number;
	private _animateFrames : number;

	private _currentObjects : Set<string>

	constructor(ui : UI, connection : Connection) {
		this._meMaterial.shadowSide = THREE.FrontSide;
		this._otherMaterial.shadowSide = THREE.FrontSide;
		this._objectMaterial.shadowSide = THREE.FrontSide;

		this._ui = ui;
		this._renderer = this._ui.renderer();
		this._connection = connection;

		this._keyUpdates = 0;
		this._lastGameUpdate = 0;
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

			const msg = this._ui.createKeyMsg();
			this._keyUpdates++;
			msg.Key.S = this._keyUpdates;
			this._connection.sendData(msg);
		}, frameMillis);
	}

	private updatePlayers(msg : any) : void {
		const addPlayer = (initData : any) => {
			const id = initData.Id;

			if (wasmHas(playerSpace, id)) return;

			const material = id == this._id ? this._meMaterial : this._otherMaterial
			const depth = 0.2;
			const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(initData.Dim.X, initData.Dim.Y, depth), material);
			playerMesh.position.x = initData.Pos.X;
			playerMesh.position.y = initData.Pos.Y;
			playerMesh.castShadow = true;
			playerMesh.receiveShadow = true;

			const outerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
			outerHand.position.z = depth / 2;
			outerHand.castShadow = true;
			outerHand.receiveShadow = true;
			playerMesh.add(outerHand);

			const innerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
			innerHand.position.z = depth / 2;
			innerHand.castShadow = true;
			innerHand.receiveShadow = true;
			playerMesh.add(innerHand);

			this._renderer.add(playerSpace, id, playerMesh);
			wasmAdd(playerSpace, id, initData);
		}
		const deletePlayer = (id : number) => {
			this._renderer.delete(playerSpace, id);
			wasmDelete(playerSpace, id);
		}

		switch(msg.T) {
			case playerInitType:
				this._id = msg.Id
				msg.Ps.forEach((initData) => {
					addPlayer(initData);
				});
				break;
			case playerJoinType:
				msg.Ps.forEach((initData) => {
					addPlayer(initData);
				});
				break;
			case leftType:
				deletePlayer(msg.Client.Id);
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
					wasmAdd(space, id, { Pos: object[posProp], Dim: object[dimProp] });
					const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 6, 4), this._bombMaterial);
					mesh.rotation.x = Math.random() * Math.PI;	
					mesh.rotation.y = Math.random() * Math.PI;	
					mesh.rotation.z = Math.random() * Math.PI;	
					mesh.receiveShadow = true;

					this._currentObjects.add(sid(space, id));
					this._renderer.add(space, id, mesh);
				}
				deleteObjects.delete(sid(space, id));

				// TODO: need updateObject()
				wasmSetData(space, id, object);
				this._renderer.updatePosition(space, id, object[posProp].X, object[posProp].Y);
			}
		}

		// Haven't seen these objects so delete them.
		deleteObjects.forEach((sid) => {
			this._currentObjects.delete(sid);
			this._renderer.delete(space(sid), id(sid));
			wasmDelete(space(sid), id(sid));
		});

		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			wasmSetData(playerSpace, id, player);
			this._renderer.updatePlayer(id, player);
		}

		if (msg.Ss.length > 0) {
			this._renderer.renderShots(msg.Ss);
		}

		this._lastGameUpdate = msg.S;
	}

	private extrapolateState() {
		const state = JSON.parse(wasmUpdateState());

		for (const [stringSpace, objects] of Object.entries(state.Os) as [string, any]) {
			for (const [stringId, object] of Object.entries(objects) as [string, any]) {
				const space = Number(stringSpace);
				const id = Number(stringId);
				if (!this._renderer.has(space, id)) continue;

				// TODO: need update()
				this._renderer.updatePosition(space, id, object[posProp].X, object[posProp].Y);
			}
		}

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!this._renderer.has(playerSpace, id)) continue;

			// TODO: smoothing for mouse movement??
			// this._renderer.updatePlayer(id, player);
			this._renderer.updatePosition(playerSpace, id, player[posProp].X, player[posProp].Y);
		}
	}

	private initLevel(msg :any) : void {
		this._currentObjects.clear();
		this._renderer.clearObjects();

		const objects = JSON.parse(wasmLoadLevel(msg.L));
		objects.Os.forEach((initData) => {
			const id = initData.Id;
			const space = initData.S;
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(initData.Dim.X, initData.Dim.Y, 1.0), this._objectMaterial);	
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			this._renderer.add(space, id, mesh);
			this._renderer.updatePosition(space, id, initData.Pos.X, initData.Pos.Y);
		});
	}

	private updateCamera() : void {
		if (!defined(this._id)) return;
		if (!this._renderer.has(playerSpace, this._id)) return;

		const playerRender = this._renderer.get(playerSpace, this._id);

		const mouse = this._renderer.getMouseScreen();
		const adj = new THREE.Vector3();
		if (Math.abs(mouse.x) > this._extendCameraXThreshold) {
			adj.x = Math.sign(mouse.x) * (Math.abs(mouse.x) - this._extendCameraXThreshold) / (1 - this._extendCameraXThreshold) * this._extendCameraX;
		}
		if (Math.abs(mouse.y) > this._extendCameraYThreshold) {
			adj.y = Math.sign(mouse.y) * (Math.abs(mouse.y) - this._extendCameraYThreshold) / (1 - this._extendCameraYThreshold) * this._extendCameraY;
		}
		this._renderer.setCamera(playerRender.position, adj);
	}
}