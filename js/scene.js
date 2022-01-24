class Scene {
    constructor() {
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        this.reset();
    }
    scene() { return this._scene; }
    reset() {
        this._scene = new THREE.Scene();
        this._lighting = new Lighting();
        this._scene.add(this._lighting.scene());
        this._renders = new Map();
    }
    add(space, id, object) {
        const map = this.getMap(space);
        if (map.has(id)) {
            debug("Overwriting object space " + space + ", id " + id + "!");
        }
        map.set(id, object);
        this._scene.add(object.mesh());
    }
    has(space, id) {
        const map = this.getMap(space);
        return map.has(id) && defined(map.get(id));
    }
    get(space, id) {
        const map = this.getMap(space);
        return map.get(id);
    }
    delete(space, id) {
        const map = this.getMap(space);
        if (map.has(id)) {
            this._scene.remove(map.get(id).mesh());
            map.delete(id);
        }
    }
    clear(space) {
        const map = this.getMap(space);
        map.forEach((id, object) => {
            this.delete(space, id);
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
    update(space, id, msg) {
        const map = this.getMap(space);
        const object = map.get(id);
        if (!defined(object)) {
            this.delete(space, id);
            return;
        }
        object.update(msg);
    }
    renderShots(shots) {
        shots.forEach((shot) => {
            const points = [
                new THREE.Vector3(shot.O.X, shot.O.Y, 0.5),
                new THREE.Vector3(shot.E.X, shot.E.Y, 0.5),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this._lineMaterial);
            this._scene.add(line);
            const light = new THREE.PointLight(0xffff00, 1, 3, 2);
            light.position.set(shot.O.X, shot.O.Y, 1);
            this._scene.add(light);
            setTimeout(() => {
                this._scene.remove(line);
                this._scene.remove(light);
            }, 60);
        });
    }
    setPlayerPosition(position) {
        this._lighting.setTarget(position);
    }
    getMap(space) {
        if (!this._renders.has(space)) {
            this._renders.set(space, new Map());
        }
        return this._renders.get(space);
    }
}
