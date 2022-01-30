var Model;
(function (Model) {
    Model[Model["UNKNOWN"] = 0] = "UNKNOWN";
    Model[Model["CHICKEN"] = 1] = "CHICKEN";
    Model[Model["UZI"] = 10] = "UZI";
})(Model || (Model = {}));
class Loader {
    constructor() {
        this._modelPrefix = "/model/";
        this._loader = new THREE.GLTFLoader();
        this._cache = new Map();
        this._paths = new Map();
        this._paths.set(Model.CHICKEN, this._modelPrefix + "chicken6.glb");
        this._paths.set(Model.UZI, this._modelPrefix + "uzi.glb");
        debug(this._paths);
    }
    preload(models) {
        models.forEach((model) => {
            this.load(model, (mesh) => { });
        });
    }
    load(model, cb) {
        if (!this._paths.has(model) || !defined(this._paths.get(model))) {
            debug("Tried to cache unknown model " + model);
            return;
        }
        debug("Loading model " + model + " from " + this._paths.get(model));
        this._loader.load(this._paths.get(model), (data) => {
            this.process(model, data);
            cb(data.scene);
        });
    }
    process(model, data) {
        switch (model) {
            case Model.CHICKEN:
                debug(data);
                data.scene.animations = data.animations;
                data.scene.getObjectByName("mesh").castShadow = true;
                data.scene.getObjectByName("mesh").receiveShadow = true;
                break;
            case Model.UZI:
                debug(data);
                break;
            default:
                debug("Model " + model + " could not be processed.");
                return;
        }
    }
}
