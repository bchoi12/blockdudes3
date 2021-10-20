class Scene {
    constructor() {
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        this.reset();
    }
    scene() { return this._scene; }
    reset() {
        this._scene = new THREE.Scene();
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
        this._scene.add(hemisphereLight);
        this._spotLight = new THREE.SpotLight(0xaaaaaa, 1);
        this._scene.add(this._spotLight);
        this._playerRenders = new Map();
        this._objectRenders = new Map();
    }
    addObject(type, id, mesh) {
        const map = this.getMap(type);
        if (map.has(id)) {
            debug("Overwriting object type " + type + ", id " + id + "!");
        }
        map.set(id, mesh);
        this._scene.add(map.get(id));
    }
    hasObject(type, id) {
        const map = this.getMap(type);
        return map.has(id);
    }
    getObject(type, id) {
        const map = this.getMap(type);
        return map.get(id);
    }
    updatePlayer(id, msg) {
        const map = this.getMap(ObjectType.PLAYER);
        const object = map.get(id);
        object.position.x = msg.Pos.X;
        object.position.y = msg.Pos.Y;
        object.children[0].position.x = msg.Dir.X * 0.5;
        object.children[0].position.y = msg.Dir.Y * 0.5;
        object.children[1].position.x = msg.Dir.X * -0.05;
        object.children[1].position.y = msg.Dir.Y * -0.05;
    }
    updatePosition(type, id, x, y) {
        const map = this.getMap(type);
        const object = map.get(id);
        object.position.x = x;
        object.position.y = y;
    }
    deleteObject(type, id) {
        const map = this.getMap(type);
        this._scene.remove(map.get(id));
        map.delete(id);
    }
    clearObjects(type) {
        const map = this.getMap(type);
        map.forEach((id, object) => {
            this._scene.remove(map.get(object));
        });
        map.clear();
    }
    renderShots(shots) {
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
            }, 100);
        });
    }
    setSpotlightPosition(x, y, z) {
        this._spotLight.position.set(x, y, z);
    }
    setSpotlightTarget(x, y, z) {
        this._spotLight.target.position.set(x, y, z);
    }
    getMap(type) {
        switch (type) {
            case ObjectType.PLAYER:
                return this._playerRenders;
            case ObjectType.OBJECT:
                return this._objectRenders;
            default:
                debug("Unknown object type " + type);
        }
    }
}
