enum Model {
	UNKNOWN = 0,
	CHICKEN = 1,
}

class Loader {
	private readonly _modelPrefix = "/model/";

	private _loader : any;
	private _cache : Map<Model, any>;
	private _paths : Map<Model, string>;

	constructor() {
		this._loader = new THREE.GLTFLoader();
		this._cache = new Map<Model, any>();

		this._paths = new Map<Model, string>();
		this._paths.set(Model.CHICKEN, this._modelPrefix + "chicken4.glb");

		debug(this._paths);
	}

	preload(models : Array<Model>) : void {
		models.forEach((model) => {
			this.load(model, (mesh) => {}); 
		});
	}

	load(model : Model, cb : (any) => void) : void {
		if (!this._paths.has(model) || !defined(this._paths.get(model))) {
			debug("Tried to cache unknown model " + model);
			return;
		}

/*
		if (this._cache.has(model)) {
			debug("Loading model " + model + " from cache.");
			cb(this._cache.get(model));
			return;
		}
*/

		debug("Loading model " + model + " from " + this._paths.get(model));
		this._loader.load(this._paths.get(model), (data) => {
			this.process(model, data);
			cb(data.scene);
/*
			this._cache.set(model, data.scene);
			cb(this._cache.get(model));
*/
		});
	}

	private process(model : Model, data : any) : void {
		const materials = new Map<string, any>();

		switch (model) {
			case Model.CHICKEN:
				debug(data);
				data.scene.animations = data.animations;
				data.scene.scale.set(0.5, 0.5, 0.5);

				data.scene.getObjectByName("mesh").castShadow = true;
				data.scene.getObjectByName("mesh").receiveShadow = true;
				data.scene.getObjectByName("mesh").position.y = 0;
				break;
			default:
				debug("Model " + model + " could not be processed.");
				return;
		}
	}
}