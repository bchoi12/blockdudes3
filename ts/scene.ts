class Scene {
	private readonly _lineMaterial = new THREE.LineBasicMaterial( { color: 0xffff00 } );

	private _scene : any;
	private _lighting : Lighting;
	private _renders : Map<number, Map<number, RenderObject>>;

	constructor() {
		this.reset();
	}

	scene() : any { return this._scene; }

	reset() : void {
		this._scene = new THREE.Scene();
		this._lighting = new Lighting();
		this._scene.add(this._lighting.scene());

		this._renders = new Map();
	}

	add(space : number, id : number, object : any) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			debug("Overwriting object space " + space + ", id " + id + "!");
		}
		map.set(id, object);
		this._scene.add(object.mesh());
	}

	has(space : number, id : number) : boolean {
		const map = this.getMap(space);
		return map.has(id) && defined(map.get(id));	
	}

	get(space : number, id : number) : any {
		const map = this.getMap(space);
		return map.get(id);
	}

	delete(space : number, id : number) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			this._scene.remove(map.get(id).mesh());
			map.delete(id);
		}
	}

	clear(space : number) : void {
		const map = this.getMap(space);
		map.forEach((id, object) => {
			this.delete(space, id);
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

	update(space : number, id : number, msg : any) : void {
		const map = this.getMap(space);
		const object = map.get(id);

		if (!defined(object)) {
			this.delete(space, id);
			return;
		}

		object.update(msg);
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
		this._lighting.setTarget(position);
	}

	private getMap(space : number) : Map<number, any> {
		if (!this._renders.has(space)) {
			this._renders.set(space, new Map<number, any>());
		}
		return this._renders.get(space);
	}
}