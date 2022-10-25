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

	COWBOY_HAT = "COWBOY_HAT",
	JETPACK = "JETPACK",
	HEADBAND = "HEADBAND",
	SCOUTER = "SCOUTER",

	ARCH_BASE = "ARCH_BASE",
	ARCH_ROOF = "ARCH_ROOF",
	ARCH_BALCONY = "ARCH_BALCONY",
	ARCH_HUT = "ARCH_HUT",
	TABLE = "TABLE",

	BEACH_BALL = "BEACH_BALL",
	TRASH_CAN = "TRASH_CAN",
	POTTED_TREE = "POTTED_TREE",
}

export enum Texture {
	UNKNOWN = "",
	WATER_NORMALS = "WATER_NORMALS",
	SAND = "SAND",
}

class Loader {
	private readonly _modelPrefix = "./model/";
	private readonly _texturePrefix = "./texture/";

	private readonly _preloadSet = [
		Model.CHICKEN,
		Model.UZI,
		Model.BAZOOKA,
		Model.SNIPER,
		Model.STAR_GUN,
		Model.ROCKET,
		Model.COWBOY_HAT,
		Model.JETPACK,
		Model.HEADBAND,
		Model.SCOUTER,
		Model.ARCH_BASE,
		Model.ARCH_ROOF,
		Model.ARCH_BALCONY,
		Model.ARCH_HUT,
		Model.TABLE,
	];

	private _gltfLoader : GLTFLoader;
	private _textureLoader : THREE.TextureLoader;

	private _paths : Map<Model, string>;
	private _texturePaths : Map<Texture, string>;

	constructor() {
		this._gltfLoader = new GLTFLoader();
		this._textureLoader = new THREE.TextureLoader();

		this._paths = new Map<Model, string>();
		this._texturePaths = new Map<Texture, string>();

		for (const model in Model) {
			if (model.length === 0) {
				continue;
			}

			this._paths.set(Model[model], this._modelPrefix + model.toLowerCase() + ".glb");
		}
		this.preload();

		for (const texture in Texture) {
			if (texture.length === 0) {
				continue;
			}

			this._texturePaths.set(Texture[texture], this._texturePrefix + texture.toLowerCase() + ".jpg");
		}
	}

	load(model : Model, cb? : (object: THREE.Object3D) => void) : void {
		if (!this._paths.has(model)) {
			return;
		}

		this._gltfLoader.load(this._paths.get(model), (data) => {
			this.process(model, data);

			if (Util.defined(cb)) {
				cb(data.scene);
			}
		}, () => {}, (error) => {
			console.error("Failed to load model " + model + ": " + error)
		});
	}

	loadTexture(texture : Texture, cb? : (object: THREE.Texture) => void) : THREE.Texture {
		if (!this._texturePaths.has(texture)) {
			return;
		}

		return this._textureLoader.load(this._texturePaths.get(texture), (texture) => {
			if (Util.defined(cb)) {
				cb(texture);
			}
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

	preload(cb? : () => void) : void {
		this.preloadHelper(0, cb);
	}

	private preloadHelper(i : number, cb? : () => void) : void {
		if (i >= this._preloadSet.length) {
			if (Util.defined(cb)) {
				cb();
			}
			return;
		}
		this.load(this._preloadSet[i], () => { this.preloadHelper(i + 1); });
	}

	private process(model : Model, data : any) : void {
		switch (model) {
			case Model.CHICKEN:
			case Model.DUCK:
			case Model.UZI:
			case Model.BAZOOKA:
			case Model.SNIPER:
			case Model.STAR_GUN:
			case Model.COWBOY_HAT:
			case Model.JETPACK:
			case Model.HEADBAND:
			case Model.SCOUTER:
			case Model.ROCKET:
				data.scene.animations = data.animations;
				data.scene.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.castShadow = options.enableShadows;
						child.receiveShadow = options.enableShadows;
					}
				});
				break;
			case Model.ARCH_BASE:
			case Model.ARCH_ROOF:
			case Model.ARCH_BALCONY:
			case Model.ARCH_HUT:
			case Model.TABLE:
			case Model.POTTED_TREE:
			case Model.BEACH_BALL:
			case Model.TRASH_CAN:
				data.scene.traverse((child) => {
					let processed = new Set<string>();
					if (child.material && !processed.has(child.material.name)) {
						const name = child.material.name;
						const imported = child.material;
						child.material = new THREE.MeshLambertMaterial();
						child.material.name = name;
						child.material.side = imported.side;
						child.material.shadowSide = imported.shadowSide;
						child.material.color = imported.color;
						child.material.map = imported.map;

						const components = new Set(name.split("-"));
						if (components.has("transparent")) {
							child.material.transparent = true;
							child.material.opacity = 0.5;
						}
						processed.add(name);
					}
					if (child instanceof THREE.Mesh) {
						child.castShadow = options.enableShadows;
						child.receiveShadow = options.enableShadows;
					}
				});

				if (model === Model.BEACH_BALL) {
					data.scene.getObjectByName("mesh").position.y += 0.4;
					data.scene.getObjectByName("mesh").rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
				}
				break;
			default:
				LogUtil.d("Model " + model + " processing skipped.");
				break;
		}
	}
}

export const loader = new Loader();