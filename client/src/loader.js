import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LogUtil, Util } from './util.js';
import { options } from './options.js';
export var Model;
(function (Model) {
    Model[Model["UNKNOWN"] = 0] = "UNKNOWN";
    Model[Model["CHICKEN"] = 1] = "CHICKEN";
    Model[Model["DUCK"] = 2] = "DUCK";
    Model[Model["UZI"] = 10] = "UZI";
    Model[Model["ROCKET"] = 11] = "ROCKET";
})(Model || (Model = {}));
class Loader {
    constructor() {
        this._modelPrefix = "./model/";
        this._loader = new GLTFLoader();
        this._cache = new Map();
        this._paths = new Map();
        this._paths.set(Model.CHICKEN, this._modelPrefix + "chicken.glb");
        this._paths.set(Model.DUCK, this._modelPrefix + "duck.glb");
        this._paths.set(Model.UZI, this._modelPrefix + "uzi.glb");
        this._paths.set(Model.ROCKET, this._modelPrefix + "rocket.glb");
    }
    preload(models) {
        models.forEach((model) => {
            this.load(model, (mesh) => { });
        });
    }
    load(model, cb) {
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
    process(model, data) {
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
