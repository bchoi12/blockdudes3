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

	private readonly _meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	private readonly _otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	private readonly _objectMaterial = new THREE.MeshBasicMaterial( {color: 0x777777 } );
	
	private _ui : UI;
	private _renderer : Renderer;
	private _connection : Connection;

	private _id : number;
	private _objects : Map<number, any>;
	private _lastPlayerUpdate : number;
	private _animateFrames : number;

	constructor(ui : UI, connection : Connection) {
		this._ui = ui;
		this._renderer = this._ui.renderer();
		this._connection = connection;

		this._id = -1;
		this._objects = new Map();
		this._lastPlayerUpdate = 0;
		this._animateFrames = 0;

		this.initHandlers();
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
		this.updateState();
		this.updateCamera();
		this._renderer.render();
		this._animateFrames++;

		requestAnimationFrame(() => { this.animate(); });
	}

	private initHandlers() : void {
		this._connection.addHandler(initType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(joinType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(leftType, (msg : any) => { this.updatePlayers(msg); });

		this._connection.addHandler(playerStateType, (msg : any) => { this.updatePlayerState(msg); });
		this._connection.addHandler(objectInitType, (msg : any) => { this.initObjects(msg); });
	}

	private updatePlayers(msg : any) : void {
		const addPlayer = (id : number) => {
			this._renderer.addObject(ObjectType.PLAYER, id, new THREE.Mesh(new THREE.BoxGeometry(), id == this._id ? this._meMaterial : this._otherMaterial));
			wasmAddPlayer(id);
		}
		const deletePlayer = (id : number) => {
			this._renderer.deleteObject(ObjectType.PLAYER, id);
			wasmDeletePlayer(id);
		}

		switch(msg.T) {
			case initType:
				this._id = msg.Id;
				for (const [stringId, client] of Object.keys(msg.Cs) as [string, any]) {
					// Add all other players, self will be added in join
					if (this._id == Number(stringId)) continue;
					addPlayer(Number(stringId));
				}
				break;
			case joinType:
				addPlayer(msg.Id);
				break;
			case leftType:
				deletePlayer(msg.Id);
				break;
		}
	}

	private updatePlayerState(msg : any) : void {
		if (this._lastPlayerUpdate > msg.TS) return;

		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			wasmSetPlayerData(id, player);
			this._renderer.updateObject(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
		}

		this._lastPlayerUpdate = msg.TS;
	}

	private initObjects(msg :any) : void {
		this._renderer.clearObjects(ObjectType.OBJECT);
		this._objects.clear();

		for (const [stringId, object] of Object.entries(msg.Os) as [string, any]) {
			const id = Number(stringId);

			this._objects.set(id, object);

			const mesh = new THREE.Mesh(new THREE.BoxGeometry(), this._objectMaterial);
			this._renderer.addObject(ObjectType.OBJECT, id, mesh);
			this._renderer.updateObject(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
		}
	}

	private updateCamera() : void {
		if (!this._renderer.hasObject(ObjectType.PLAYER, this._id)) return;

		const playerRender = this._renderer.getObject(ObjectType.PLAYER, this._id);
		this._renderer.setCamera(playerRender.position.x, playerRender.position.y);
	}

	private updateState() {
		const state = JSON.parse(wasmUpdateState());

		for (const [stringId, player] of Object.entries(state.Ps) as [string, any]) {
			const id = Number(stringId);
			if (!this._renderer.hasObject(ObjectType.PLAYER, id)) continue;

			this._renderer.updateObject(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
		}
	}
}