import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { LogUtil, Util } from './util.js'

import { options } from './options.js'

export enum Model {
	UNKNOWN = "",
	CHICKEN = "CHICKEN",
	DUCK = "DUCK",

	UZI = "UZI",
	BAZOOKA = "BAZOOKA",
	SNIPER = "SNIPER",
	STAR_GUN = "STAR_GUN",

	ROCKET = "ROCKET",
}

export enum Typeface {
	UNKNOWN = "",
	HELVETIKER_BOLD = "HELVETIKER_BOLD",
	HELVETIKER_REGULAR = "HELVETIKER_REGULAR",
}

class Loader {
	private readonly _modelPrefix = "./model/";
	private readonly _fontPrefix = "./typeface/";

	private _loader : GLTFLoader;
	private _paths : Map<Model, string>;

	private _fontLoader : FontLoader;
	private _fontPaths : Map<Typeface, string>

	constructor() {
		this._loader = new GLTFLoader();
		this._paths = new Map<Model, string>();

		this._fontLoader = new FontLoader();
		this._fontPaths = new Map<Typeface, string>();

		for (const model in Model) {
			if (model.length === 0) {
				continue;
			}

			this._paths.set(Model[model], this._modelPrefix + model.toLowerCase() + ".glb");
		}
		this.preload();

		for (const typeface in Typeface) {
			if (typeface.length === 0) {
				continue;
			}

			this._fontPaths.set(Typeface[typeface], this._fontPrefix + typeface.toLowerCase() + ".typeface.json");
		}
	}

	load(model : Model, cb : (any) => void) : void {
		if (!this._paths.has(model)) {
			LogUtil.d("Tried to load unknown model " + model);
			return;
		}

		this._loader.load(this._paths.get(model), (data) => {
			this.process(model, data);
			cb(data.scene);
		});
	}

	getWeaponModel(weaponType : number) : Model {
		switch (weaponType) {
			case uziWeapon:
				return Model.UZI;
			case bazookaWeapon:
				return Model.BAZOOKA;
			case sniperWeapon:
				return Model.SNIPER;
			case starWeapon:
				return Model.STAR_GUN;
		}
		return Model.UNKNOWN;
	}

	loadFont(typeface : Typeface, cb : (any) => void) : void {
		if (!this._fontPaths.has(typeface)) {
			LogUtil.d("Tried to load unknown typeface " + typeface);
			return;
		}

		this._fontLoader.load(this._fontPaths.get(typeface), (font) => {
			cb(font);
		});
	}

	private preload() : void {
		// TODO: revisit loading everything, this could be smarter
		this._paths.forEach((path, model) => {
			this.load(Model[model], () => {});
		});
	}

	private process(model : Model, data : any) : void {
		switch (model) {
			case Model.CHICKEN:
			case Model.DUCK:
				data.scene.animations = data.animations;
				if (options.enableShadows) {
					data.scene.getObjectByName("mesh").castShadow = true;
					data.scene.getObjectByName("mesh").receiveShadow = true;
				}
				break;
			case Model.UZI:
			case Model.BAZOOKA:
			case Model.SNIPER:
			case Model.STAR_GUN:
			case Model.ROCKET:
				if (options.enableShadows) {
					data.scene.getObjectByName("mesh").castShadow = true;
					data.scene.getObjectByName("mesh").receiveShadow = true;
				}
				break;
			default:
				LogUtil.d("Model " + model + " processing skipped.");
				break;
		}
	}
}

export const loader = new Loader();