declare var THREE: any;

enum GameState {
	UNKNOWN = 0,
}

class Game {
	private readonly _meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	private readonly _otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	private readonly _objectMaterial = new THREE.MeshBasicMaterial( {color: 0x777777 } );
	
	private _canvas : HTMLElement
	private _connection : Connection;

	private _scene : any;
	private _camera : any;
	private _renderer : any;

	private _id : number;
	private _players : Map<number, any>;
	private _playerRenders : Map<number, any>;
	private _objects : Map<number, any>;
	private _objectRenders : Map<number, any>;

	private _fps : number;
	private _animateFrames : number;
	private _lastStateUpdate : number;

	constructor(canvas : HTMLElement, connection : Connection) {
		this._canvas = canvas;
		this._connection = connection;

		this.reset();
		this.initHandlers();

		this.resizeCanvas();
		window.onresize = () => { this.resizeCanvas(); };
	}

	animate() : void {
		this.previewPlayers();
		this.updateCamera();
		this._renderer.render(this._scene, this._camera);
		this._animateFrames++;

		requestAnimationFrame(() => { this.animate(); });
	}

	private reset() : void {
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera( 75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000 );
		this._camera.position.z = 5;
		this._renderer = new THREE.WebGLRenderer( {canvas: this._canvas});
		this._renderer.setClearColor(0xffffff);

		this._id = -1;
		this._players = new Map();
		this._playerRenders = new Map();
		this._objects = new Map();
		this._objectRenders = new Map();
		this._lastStateUpdate = Date.now();

		this.animate();
	}

	private initHandlers() : void {
		this._connection.addHandler(initType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(joinType, (msg : any) => { this.updatePlayers(msg); });
		this._connection.addHandler(leftType, (msg : any) => { this.updatePlayers(msg); });

		this._connection.addHandler(playerStateType, (msg : any) => { this.updatePlayerState(msg); });
		this._connection.addHandler(objectInitType, (msg : any) => { this.initObjects(msg); });
	}

	private updatePlayers(msg : any) : void {
		const createPlayer = (id : number) => {
			this._players.set(id, {});
		}
		const deletePlayer = (id : number) => {
			this._players.delete(id);
			this._scene.remove(this._playerRenders.get(id));
			this._playerRenders.delete(id);				
		}

		switch(msg.T) {
			case initType:
				this.reset();
				this._id = msg.Id;
				for (const [stringId, client] of Object.keys(msg.Cs) as [string, any]) {
					createPlayer(Number(stringId));
				}
				break;
			case joinType:
				createPlayer(msg.Id);
				break;
			case leftType:
				deletePlayer(msg.Id);
				break;
		}
	}

	private updatePlayerState(msg : any) : void {
		for (const [stringId, player] of Object.entries(msg.Ps) as [string, any]) {
			const id = Number(stringId);

			if (!this._players.has(id)) continue;

			if (!this._playerRenders.has(id)) {
				this._playerRenders.set(id, new THREE.Mesh(new THREE.BoxGeometry(), id == this._id ? this._meMaterial : this._otherMaterial));
				this._scene.add(this._playerRenders.get(id));
			}

			this._players.set(id, player);
			this._playerRenders.get(id).position.x = player.Pos.X;
			this._playerRenders.get(id).position.y = player.Pos.Y;
		}
		this._lastStateUpdate = Date.now();
	}

	private initObjects(msg :any) : void {
		for (const render of this._objectRenders) {
			this._scene.remove(render);
		}
		this._objects.clear();
		this._objectRenders.clear();

		for (const [stringId, object] of Object.entries(msg.Os) as [string, any]) {
			const id = Number(stringId);

			this._objects.set(id, object);

			const mesh = new THREE.Mesh(new THREE.BoxGeometry(), this._objectMaterial);
			mesh.position.x = object.Pos.X;
			mesh.position.y = object.Pos.Y;
			this._objectRenders.set(id, mesh);
			this._scene.add(mesh);
		}
	}

	private resizeCanvas() : void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		this._canvas.style.width = width + "px";
		this._canvas.style.height = height + "px";

		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	}

	private updateCamera() : void {
		if (!this._playerRenders.has(this._id)) return;

		const playerRender = this._playerRenders.get(this._id);
		this._camera.position.x = playerRender.position.x;
		this._camera.position.y = playerRender.position.y;
	}

	private previewPlayers() {
		const timeStepSec = (Date.now() - this._lastStateUpdate) / 1000;
		if (timeStepSec > 0.2) return;

		this._playerRenders.forEach((render : any, id : number) => {
			const player = this._players.get(id);
			render.position.x = player.Pos.X  + player.Vel.X * timeStepSec;
			render.position.y = player.Pos.Y + player.Vel.Y * timeStepSec;
		})	
	}

}