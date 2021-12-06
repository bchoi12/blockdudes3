class Scene {
	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0xffff00 } );

	private _scene : any;
	private _renders : Map<number, Map<number, any>>;

	private _sunLight : any;
	private _sunLightOffset : any;

	constructor() {
		this.reset();
	}

	scene() : any { return this._scene; }

	reset() : void {
		this._scene = new THREE.Scene();

		const hemisphereLight = new THREE.HemisphereLight(0x555555, 0x232323, 0.7);
		this._scene.add(hemisphereLight);

		this._sunLight = new THREE.DirectionalLight(0xfdfbd3, 0.8);
		// this._sunLight = new THREE.DirectionalLight(0x6f6e92, 0.8);
		this._sunLightOffset = new THREE.Vector3(-100, 100, 100);
		this._sunLight.position.copy(this._sunLightOffset);
		this._sunLight.castShadow = true;
		const side = 10;
		this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500 );
		this._sunLight.shadow.mapSize.width = 1024;
		this._sunLight.shadow.mapSize.height = 1024;
		this._sunLight.shadow.bias = -0.00012;

		this._scene.add(this._sunLight);
		this._scene.add(this._sunLight.target);

		this._renders = new Map();
	}

	add(space : number, id : number, mesh : any) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			debug("Overwriting object space " + space + ", id " + id + "!");
		}

		map.set(id, mesh);
		this._scene.add(map.get(id));
	}

	has(space : number, id : number) : boolean {
		const map = this.getMap(space);
		return map.has(id);	
	}

	get(space : number, id : number) : any {
		const map = this.getMap(space);
		return map.get(id);
	}

	delete(space : number, id : number) : void {
		const map = this.getMap(space);
		this._scene.remove(map.get(id));
		map.delete(id);
	}

	clear(space : number) : void {
		const map = this.getMap(space);
		map.forEach((id, object) => {
			this._scene.remove(map.get(object));
		});
		map.clear();
	}

	clearObjects() : void {
		this._renders.forEach((render, space) => {
			if (space != playerSpace) {
				this.clear(space);
			}
		});
	}

	updatePlayer(id : number, msg : any) : void {
		const map = this.getMap(playerSpace);
		const object = map.get(id);
		const pos = msg[posProp]
		object.position.x = pos.X;
		object.position.y = pos.Y;

		// TODO: need player class
		const dir = msg[dirProp]
		object.children[0].position.x = dir.X * 0.5;
		object.children[0].position.y = dir.Y * 0.5;
		object.children[1].position.x = dir.X * -0.05;
		object.children[1].position.y = dir.Y * -0.05;
	}

	updatePosition(space : number, id : number, x : number, y : number) : void {
		const map = this.getMap(space);
		const object = map.get(id);
		object.position.x = x;
		object.position.y = y;
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

	private getMap(space : number) : Map<number, any> {
		if (!this._renders.has(space)) {
			this._renders.set(space, new Map<number, any>());
		}
		return this._renders.get(space);
	}
}