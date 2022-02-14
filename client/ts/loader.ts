import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LogUtil, Util } from './util.js'

export enum Model {
	UNKNOWN = 0,
	CHICKEN = 1,

	UZI = 10,
}

export class Loader {
	private readonly _modelPrefix = "./model/";

	private _loader : GLTFLoader;
	private _cache : Map<Model, any>;
	private _paths : Map<Model, string>;

	constructor() {
		this._loader = new GLTFLoader();
		this._cache = new Map<Model, any>();

		this._paths = new Map<Model, string>();
		this._paths.set(Model.CHICKEN, this._modelPrefix + "chicken6.glb");
		this._paths.set(Model.UZI, this._modelPrefix + "uzi.glb");

		LogUtil.d(this._paths);
	}

	preload(models : Array<Model>) : void {
		models.forEach((model) => {
			this.load(model, (mesh) => {}); 
		});
	}

	load(model : Model, cb : (any) => void) : void {
		if (!this._paths.has(model) || !Util.defined(this._paths.get(model))) {
			LogUtil.d("Tried to cache unknown model " + model);
			return;
		}

/*
		if (this._cache.has(model)) {
			LogUtil.d("Loading model " + model + " from cache.");
			cb(this._cache.get(model));
			return;
		}
*/

		LogUtil.d("Loading model " + model + " from " + this._paths.get(model));
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
		switch (model) {
			case Model.CHICKEN:
				LogUtil.d(data);
				data.scene.animations = data.animations;
				data.scene.getObjectByName("mesh").castShadow = true;
				data.scene.getObjectByName("mesh").receiveShadow = true;
				break;
			case Model.UZI:
				LogUtil.d(data);
				break;
			default:
				LogUtil.d("Model " + model + " could not be processed.");
				return;
		}
	}
}