class Renderer {
    constructor(canvas) {
        this._cameraOffsetY = 0.6;
        this._cameraOffsetZ = 6.0;
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        this._canvas = canvas;
        this.reset();
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    render() { this._renderer.render(this._scene, this._camera); }
    setMouseFromPixels(mouse) { this._mousePixels = mouse.clone(); }
    getMouseScreen() {
        const mouse = this._mousePixels.clone();
        mouse.x -= window.innerWidth / 2;
        mouse.y -= window.innerHeight / 2;
        mouse.x /= window.innerWidth / 2;
        mouse.y /= -window.innerHeight / 2;
        return mouse;
    }
    getMouseWorld() {
        const mouse = this.getMouseScreen();
        mouse.unproject(this._camera.clone());
        mouse.sub(this._camera.position).normalize();
        const distance = -this._camera.position.z / mouse.z;
        const mouseWorld = this._camera.position.clone();
        mouseWorld.add(mouse.multiplyScalar(distance));
        return mouseWorld;
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
        object.children[0].position.x = msg.Dir.X * 0.65;
        object.children[0].position.y = msg.Dir.Y * 0.65;
        object.children[1].position.x = msg.Dir.X * 0.15;
        object.children[1].position.y = msg.Dir.Y * 0.15;
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
    setCamera(player, adj) {
        this._camera.position.x = player.x + adj.x;
        this._camera.position.y = player.y + adj.y + this._cameraOffsetY;
        this._spotLight.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
        this._spotLight.target.position.set(this._camera.position.x, this._camera.position.y, 0);
    }
    reset() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
        this._camera.position.z = this._cameraOffsetZ;
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setClearColor(0xaaaaff);
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
        this._scene.add(hemisphereLight);
        this._spotLight = new THREE.SpotLight(0xaaaaaa, 1);
        this._spotLight.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
        this._spotLight.target.position.set(this._camera.position.x, this._camera.position.y, 0);
        this._spotLight.castShadow = true;
        this._scene.add(this._spotLight);
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
