class Scene {
    constructor() {
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        this.reset();
    }
    scene() { return this._scene; }
    reset() {
        this._scene = new THREE.Scene();
        const hemisphereLight = new THREE.HemisphereLight(0x555555, 0x232323, 0.7);
        this._scene.add(hemisphereLight);
        this._sunLight = new THREE.DirectionalLight(0xfdfbd3, 0.8);
        this._sunLightOffset = new THREE.Vector3(-100, 100, 100);
        this._sunLight.position.copy(this._sunLightOffset);
        this._sunLight.castShadow = true;
        const side = 10;
        this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500);
        this._sunLight.shadow.mapSize.width = 1024;
        this._sunLight.shadow.mapSize.height = 1024;
        this._sunLight.shadow.bias = -0.00012;
        this._scene.add(this._sunLight);
        this._scene.add(this._sunLight.target);
        this._renders = new Map();
    }
    add(space, id, mesh) {
        const map = this.getMap(space);
        if (map.has(id)) {
            debug("Overwriting object space " + space + ", id " + id + "!");
        }
        map.set(id, mesh);
        this._scene.add(map.get(id));
    }
    has(space, id) {
        const map = this.getMap(space);
        return map.has(id);
    }
    get(space, id) {
        const map = this.getMap(space);
        return map.get(id);
    }
    delete(space, id) {
        const map = this.getMap(space);
        this._scene.remove(map.get(id));
        map.delete(id);
    }
    clear(space) {
        const map = this.getMap(space);
        map.forEach((id, object) => {
            this._scene.remove(map.get(object));
        });
        map.clear();
    }
    clearObjects() {
        this._renders.forEach((render, space) => {
            if (space != playerSpace) {
                this.clear(space);
            }
        });
    }
    updatePlayer(id, msg) {
        const map = this.getMap(playerSpace);
        const object = map.get(id);
        const pos = msg[posProp];
        object.position.x = pos.X;
        object.position.y = pos.Y;
        const dir = msg[dirProp];
        object.children[0].position.x = dir.X * 0.5;
        object.children[0].position.y = dir.Y * 0.5;
        object.children[1].position.x = dir.X * -0.05;
        object.children[1].position.y = dir.Y * -0.05;
    }
    updatePosition(space, id, x, y) {
        const map = this.getMap(space);
        const object = map.get(id);
        object.position.x = x;
        object.position.y = y;
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
            }, 50);
        });
    }
    setPlayerPosition(position) {
        this._sunLight.target.position.copy(position);
    }
    getMap(space) {
        if (!this._renders.has(space)) {
            this._renders.set(space, new Map());
        }
        return this._renders.get(space);
    }
}
