enum GameState {
	UNKNOWN = 0,
}

enum ObjectType {
	UNKNOWN = 0,
	PLAYER = 1,
	OBJECT = 2,
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
	
	private _ui : UI;
	private _renderer : Renderer;
	private _connection : Connection;

	private _id : number;
	private _keyUpdates : number;
	private _lastGameUpdate : number;
	private _animateFrames : number;

	constructor(ui : UI, connection : Connection) {
		this._ui = ui;
		this._renderer = this._ui.renderer();
		this._connection = connection;

		this._keyUpdates = 0;
		this._lastGameUpdate = 0;
		this._animateFrames = 0;

		this.initServerTalk();
	}

	start() : void {
		this._ui.displayGame();
		this._id = this._connection.id();
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

		this._animateFrames++;
		requestAnimationFrame(() => { this.animate(); });
	}

	private initServerTalk() : void {
		this._connection.addHandler(initType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(leftType, (msg : any) => { this.updatePlayers(msg); });

		this._connection.addHandler(gameStateType, (msg : any) => { this.updateGameState(msg); });
		this._connection.addHandler(playerInitType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(objectInitType, (msg : any) => { this.initObjects(msg); });

		this._connection.addSender(keyType, () => {
			const msg = this._ui.createKeyMsg();
			this._keyUpdates++;
			msg.Key.S = this._keyUpdates;
			this._connection.sendData(msg);
		}, frameMillis);
	}

	private updatePlayers(msg : any) : void {
		const addPlayer = (id : number, initData : any) => {
			if (wasmHasPlayer(id)) return;

			const material = id == this._id ? this._meMaterial : this._otherMaterial
			const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(initData.Dim.X, initData.Dim.Y, 0.3), material);
			playerMesh.castShadow = true;
			playerMesh.receiveShadow = true;

			const outerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
			outerHand.position.z = 0.4;
			outerHand.castShadow = true;
			outerHand.receiveShadow = true;
			playerMesh.add(outerHand);

			const innerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
			innerHand.position.z = 0.4;
			innerHand.castShadow = true;
			innerHand.receiveShadow = true;
			playerMesh.add(innerHand);

			this._renderer.addObject(ObjectType.PLAYER, id, playerMesh);
			wasmAddPlayer(id, initData);
		}
		const deletePlayer = (id : number) => {
			this._renderer.deleteObject(ObjectType.PLAYER, id);
			wasmDeletePlayer(id);
		}

		switch(msg.T) {
			case initType:
				// I don't like this
				this._id = msg.Id;
				break;
			case playerInitType:
				for (const [stringId, initData] of Object.entries(msg.Ps) as [string, any]) {
					addPlayer(Number(stringId), initData);
				}
				break;
			case leftType:
				deletePlayer(msg.Id);
				break;
		}
	}

	private updateGameState(msg : any) : void {
		if (this._lastGameUpdate >= msg.S) return;

		for (const [stringId, object] of Object.entries(msg.Os) as [string, any]) {
			const id = Number(stringId);

			// TODO: need updateObject()
			this._renderer.updatePosition(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
		}

		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			wasmSetPlayerData(id, player);
			this._renderer.updatePlayer(id, player);
		}

		if (msg.Ss.length > 0) {
			this._renderer.renderShots(msg.Ss);
		}

		this._lastGameUpdate = msg.S;
	}

	private initObjects(msg :any) : void {
		this._renderer.clearObjects(ObjectType.OBJECT);

		for (const [stringId, object] of Object.entries(msg.Os) as [string, any]) {
			const id = Number(stringId);

			wasmAddObject(id, object);
			const mesh = new THREE.Mesh(new THREE.BoxGeometry(object.Dim.X, object.Dim.Y, 1.0), this._objectMaterial);
			
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			this._renderer.addObject(ObjectType.OBJECT, id, mesh);
			this._renderer.updatePosition(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
		}
	}

	private updateCamera() : void {
		if (!this._renderer.hasObject(ObjectType.PLAYER, this._id)) return;

		const playerRender = this._renderer.getObject(ObjectType.PLAYER, this._id);

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

	private extrapolateState() {
		const state = JSON.parse(wasmUpdateState());

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!this._renderer.hasObject(ObjectType.PLAYER, id)) continue;

			// TODO: smoothing for mouse movement
			this._renderer.updatePosition(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
		}
	}
}