class Renderer {
	private readonly _cameraOffsetY = 0.6;
	private readonly _cameraOffsetZ = 6.0;
	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0xffff00 } );
	private readonly _cursorMaterial = new THREE.LineBasicMaterial( { color: 0xff00ff } );

	private readonly _extendCameraX = 3.2;
	private readonly _extendCameraY = 1.6;

	private _canvas : HTMLElement

	private _scene : any;
	private _camera : any;
	private _renderer : any;
	private _mouseScreen : any;
	private _mouseWorld : any;
	private _cursor : any;

	private _spotLight : any;

	private _playerRenders : Map<number, any>;
	private _objectRenders : Map<number, any>;

	constructor(canvas : HTMLElement) {
		this._canvas = canvas;

		this.reset();
		this.resizeCanvas();

		window.onresize = () => { this.resizeCanvas(); };
		
		this._mouseScreen = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
	}

	elm() : HTMLElement { return this._canvas; }
	render() : void { this._renderer.render(this._scene, this._camera); }
	
	setMouseFromScreen(mouse : any) : void { this._mouseScreen = mouse.clone(); }
	getMouse() : any { return this._mouseWorld }

	addObject(type : ObjectType, id : number, mesh : any) : void {
		const map = this.getMap(type);
		if (map.has(id)) {
			debug("Overwriting object type " + type + ", id " + id + "!");
		}

		map.set(id, mesh);
		this._scene.add(map.get(id));
	}

	hasObject(type : ObjectType, id : number) : boolean {
		const map = this.getMap(type);
		return map.has(id);	
	}

	getObject(type : ObjectType, id : number) : any {
		const map = this.getMap(type);
		return map.get(id);
	}

	updatePlayer(id : number, msg : any) : void {
		const map = this.getMap(ObjectType.PLAYER);
		const object = map.get(id);
		object.position.x = msg.Pos.X;
		object.position.y = msg.Pos.Y;

		object.children[0].position.x = msg.Dir.X * 0.8;
		object.children[0].position.y = msg.Dir.Y * 0.8;
	}

	updateObject(type : ObjectType, id : number, x : number, y : number) : void {
		const map = this.getMap(type);
		const object = map.get(id);
		object.position.x = x;
		object.position.y = y;
	}

	deleteObject(type : ObjectType, id : number) : void {
		const map = this.getMap(type);
		this._scene.remove(map.get(id));
		map.delete(id);
	}

	clearObjects(type : ObjectType) : void {
		const map = this.getMap(type);
		map.forEach((id, object) => {
			this._scene.remove(map.get(object));
		});
		map.clear();
	}

	getMap(type : ObjectType) : Map<number, any> {
		switch(type) {
			case ObjectType.PLAYER:
				return this._playerRenders;

			case ObjectType.OBJECT:
				return this._objectRenders;

			default:
				debug("Unknown object type " + type);
		}
	}

	renderShots(shots : Array<any>) : void {
		shots.forEach((shot) => {
			const points = [
				new THREE.Vector3(shot.O.X, shot.O.Y, 0),
				new THREE.Vector3(shot.E.X, shot.E.Y, 0),
			];
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const line = new THREE.Line(geometry, this._lineMaterial);
			this._scene.add(line);
		})
	}

	setCamera(player : any, mouse : any) : void {
		const scale = 4.0;

		let xdiff = (mouse.x - player.x) / scale;
		let ydiff = (mouse.y - player.y) / scale;

		if (Math.abs(xdiff) <= this._extendCameraX / scale) {
			xdiff = 0;
		} else {
			xdiff -= Math.sign(xdiff) * this._extendCameraX / scale;
		}
		if (Math.abs(ydiff) <= this._extendCameraY / scale) {
			ydiff = 0;
		} else {
			ydiff -= Math.sign(ydiff) * this._extendCameraY / scale;
		}

		this._camera.position.x = player.x + xdiff;
		this._camera.position.y = player.y + ydiff + this._cameraOffsetY;
	}

	updateCursor() : void {
		this._spotLight.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
		this._spotLight.target.position.set(this._camera.position.x, this._camera.position.y, 0);

		const mouse = this._mouseScreen.clone();
		mouse.x -= window.innerWidth / 2;
		mouse.y -= window.innerHeight / 2;
		mouse.x /= window.innerWidth / 2;
		mouse.y /= -window.innerHeight / 2;

		mouse.unproject(this._camera.clone());
		mouse.sub(this._camera.position).normalize();

		const distance = -this._camera.position.z / mouse.z;
		this._mouseWorld = this._camera.position.clone();
		this._mouseWorld.add(mouse.multiplyScalar(distance));
		this._cursor.position.set(this._mouseWorld.x, this._mouseWorld.y, this._mouseWorld.z);
	}

	private reset() : void {
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera( 75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000 );
		this._camera.position.z = this._cameraOffsetZ;
		this._renderer = new THREE.WebGLRenderer( {canvas: this._canvas, antialias: true});
		this._renderer.setPixelRatio(window.devicePixelRatio)

		this._cursor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), this._cursorMaterial);
		this._cursor.renderOrder = 1;
		this._cursor.material.depthTest = false;
		this._scene.add(this._cursor);

		this._renderer.setClearColor(0xaaaaff);

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
		this._scene.add(hemisphereLight);

		this._spotLight = new THREE.SpotLight(0xaaaaaa, 1);
		this._spotLight.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
		this._spotLight.target.position.set(this._camera.position.x, this._camera.position.y, 0);
		this._spotLight.castShadow = true;
		this._scene.add(this._spotLight);

		this._playerRenders = new Map();
		this._objectRenders = new Map();
	}

	private resizeCanvas() : void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		this._canvas.style.width = width + "px";
		this._canvas.style.height = height + "px";

		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	}
}