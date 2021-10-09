class Renderer {
    constructor(canvas) {
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        this._canvas = canvas;
        this.reset();
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
    }
    elm() { return this._canvas; }
    render() { this._renderer.render(this._scene, this._camera); }
    getMouse(mouse) {
        mouse.unproject(this._camera);
        mouse.sub(this._camera.position).normalize();
        var distance = -this._camera.position.z / mouse.z;
        return this._camera.position.clone().add(mouse.multiplyScalar(distance));
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
    updateObject(type, id, x, y) {
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
    renderShots(shots) {
        shots.forEach((shot) => {
            const points = [
                new THREE.Vector3(shot.O.X, shot.O.Y, 0),
                new THREE.Vector3(shot.E.X, shot.E.Y, 0),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this._lineMaterial);
            this._scene.add(line);
        });
    }
    setCamera(x, y) {
        this._camera.position.x = x;
        this._camera.position.y = y;
    }
    reset() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
        this._camera.position.z = 5;
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas });
        this._renderer.setClearColor(0xffffff);
        this._playerRenders = new Map();
        this._objectRenders = new Map();
    }
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
    }
}
