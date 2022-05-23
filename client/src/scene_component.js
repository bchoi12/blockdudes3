import * as THREE from 'three';
export var SceneComponentType;
(function (SceneComponentType) {
    SceneComponentType[SceneComponentType["UNKNOWN"] = 0] = "UNKNOWN";
    SceneComponentType[SceneComponentType["LIGHTING"] = 1] = "LIGHTING";
    SceneComponentType[SceneComponentType["WEATHER"] = 2] = "WEATHER";
    SceneComponentType[SceneComponentType["PARTICLES"] = 3] = "PARTICLES";
    SceneComponentType[SceneComponentType["FOREGROUND"] = 4] = "FOREGROUND";
})(SceneComponentType || (SceneComponentType = {}));
export class SceneComponent {
    constructor() {
        this._scene = new THREE.Scene();
        this._nextId = 1;
        this._objects = new Map();
        this._customObjects = new Map();
    }
    addObject(object) {
        this.addObjectTemp(object, -1);
    }
    addObjectTemp(object, ttl) {
        const id = this.nextId();
        this._objects.set(id, object);
        this._scene.add(object);
        if (ttl > 0) {
            setTimeout(() => {
                this._objects.delete(id);
                this._scene.remove(object);
            }, ttl);
        }
    }
    addCustom(custom) {
        this.addCustomTemp(custom, -1);
    }
    addCustomTemp(custom, ttl) {
        const id = this.nextId();
        custom.onMeshLoad(() => {
            this._customObjects.set(id, custom);
            this._scene.add(custom.mesh());
            if (ttl > 0) {
                setTimeout(() => {
                    this._customObjects.delete(id);
                    this._scene.remove(custom.mesh());
                }, ttl);
            }
        });
    }
    scene() {
        return this._scene;
    }
    update() {
        this._customObjects.forEach((custom, id) => {
            custom.update();
        });
    }
    nextId() {
        this._nextId++;
        return this._nextId - 1;
    }
}
