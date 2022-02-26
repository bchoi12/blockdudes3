import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { LogUtil, Util } from './util.js'

import { options } from './options.js'

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
		THREE.Cache.enabled = true;

		this._loader = new GLTFLoader();
		this._cache = new Map<Model, any>();

		this._paths = new Map<Model, string>();
		this._paths.set(Model.CHICKEN, this._modelPrefix + "chicken.glb");
		this._paths.set(Model.UZI, this._modelPrefix + "uzi.glb");
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

		LogUtil.d("Loading model " + model + " from " + this._paths.get(model));
		this._loader.load(this._paths.get(model), (data) => {
			this.process(model, data);
			cb(data.scene);
		});
	}

	private process(model : Model, data : any) : void {
		switch (model) {
			case Model.CHICKEN:
				data.scene.animations = data.animations;
				if (options.enableShadows) {
					data.scene.getObjectByName("mesh").castShadow = true;
					data.scene.getObjectByName("mesh").receiveShadow = true;
				}
				break;
			case Model.UZI:
				break;
			default:
				LogUtil.d("Model " + model + " could not be processed.");
				return;
		}
	}
}