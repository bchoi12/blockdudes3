class Scene {
	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0xffff00 } );

	private _scene : any;
	private _playerRenders : Map<number, any>;
	private _objectRenders : Map<number, any>;

	private _sunLight : any;
	private _sunLightOffset : any;

	constructor() {
		this.reset();
	}

	scene() : any { return this._scene; }

	reset() : void {
		this._scene = new THREE.Scene();

		const hemisphereLight = new THREE.HemisphereLight(0xff3b94, 0x37013a, 0.7);
		this._scene.add(hemisphereLight);

		this._sunLight = new THREE.DirectionalLight( 0xfdfbd3, 0.8);
		this._sunLightOffset = new THREE.Vector3(-50, 50, 50);
		this._sunLight.position.copy(this._sunLightOffset);
		this._sunLight.castShadow = true;
		const side = 10;
		this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500 );
		this._sunLight.shadow.mapSize.width = 512;
		this._sunLight.shadow.mapSize.height = 512;
		this._sunLight.shadow.bias = -0.0001;

		this._scene.add(this._sunLight);
		this._scene.add(this._sunLight.target);

		this._playerRenders = new Map();
		this._objectRenders = new Map();
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

	updatePlayer(id : number, msg : any) : void {
		const map = this.getMap(ObjectType.PLAYER);
		const object = map.get(id);
		object.position.x = msg.Pos.X;
		object.position.y = msg.Pos.Y;

		// TODO: need player class
		object.children[0].position.x = msg.Dir.X * 0.5;
		object.children[0].position.y = msg.Dir.Y * 0.5;
		object.children[1].position.x = msg.Dir.X * -0.05;
		object.children[1].position.y = msg.Dir.Y * -0.05;
	}

	updatePosition(type : ObjectType, id : number, x : number, y : number) : void {
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

	renderShots(shots : Array<any>) : void {
		shots.forEach((shot) => {
			const points = [
				new THREE.Vector3(shot.O.X, shot.O.Y, 0),
				new THREE.Vector3(shot.E.X, shot.E.Y, 0),
			];
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const line = new THREE.Line(geometry, this._lineMaterial);
			this._scene.add(line);

			setTimeout(() => {
				this._scene.remove(line);
			}, 50)
		})
	}

	setPlayerPosition(position : any) {
		this._sunLight.target.position.copy(position);
	}

	private getMap(type : ObjectType) : Map<number, any> {
		switch(type) {
			case ObjectType.PLAYER:
				return this._playerRenders;

			case ObjectType.OBJECT:
				return this._objectRenders;

			default:
				debug("Unknown object type " + type);
		}
	}
}