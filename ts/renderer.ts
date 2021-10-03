class Renderer {
	private _canvas : HTMLElement

	private _scene : any;
	private _camera : any;
	private _renderer : any;

	private _playerRenders : Map<number, any>;
	private _objectRenders : Map<number, any>;

	constructor(canvas : HTMLElement) {
		this._canvas = canvas;

		this.reset();
		this.resizeCanvas();

		window.onresize = () => { this.resizeCanvas(); };
	}

	elm() : HTMLElement {
		return this._canvas; 
	}

	render() : void {
		this._renderer.render(this._scene, this._camera);
	}

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

	updateObject(type : ObjectType, id : number, x : number, y : number) : void {
		const map = this.getMap(type);
		const object = map.get(id);
		object.position.x = x;
		object.position.y = y;
	}

	deleteObject(type : ObjectType, id : number) : void {
		const map = this.getMap(type);
		map.delete(id);
	}

	clearObjects(type : ObjectType) : void {
		const map = this.getMap(type);
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

	setCamera(x : number, y : number) : void {
		this._camera.position.x = x;
		this._camera.position.y = y;
	}

	private reset() : void {
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera( 75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000 );
		this._camera.position.z = 5;
		this._renderer = new THREE.WebGLRenderer( {canvas: this._canvas});
		this._renderer.setClearColor(0xffffff);

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