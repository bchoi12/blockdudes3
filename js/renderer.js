class Renderer {
    constructor(canvas) {
        this._cameraOffsetY = 0.6;
        this._cameraOffsetZ = 6.0;
        this._lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        this._cursorMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
        this._extendCameraX = 3.2;
        this._extendCameraY = 1.6;
        this._canvas = canvas;
        this.reset();
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mouseScreen = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    render() { this._renderer.render(this._scene, this._camera); }
    setMouseFromScreen(mouse) { this._mouseScreen = mouse.clone(); }
    getMouse() { return this._mouseWorld; }
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
        object.children[0].position.x = msg.Dir.X * 0.8;
        object.children[0].position.y = msg.Dir.Y * 0.8;
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
    setCamera(player, mouse) {
        const scale = 4.0;
        let xdiff = (mouse.x - player.x) / scale;
        let ydiff = (mouse.y - player.y) / scale;
        if (Math.abs(xdiff) <= this._extendCameraX / scale) {
            xdiff = 0;
        }
        else {
            xdiff -= Math.sign(xdiff) * this._extendCameraX / scale;
        }
        if (Math.abs(ydiff) <= this._extendCameraY / scale) {
            ydiff = 0;
        }
        else {
            ydiff -= Math.sign(ydiff) * this._extendCameraY / scale;
        }
        this._camera.position.x = player.x + xdiff;
        this._camera.position.y = player.y + ydiff + this._cameraOffsetY;
    }
    updateCursor() {
        this._spotLight.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
        this._spotLight.target.position.set(this._camera.position.x, this._camera.position.y, 0);
        const mouse = this._mouseScreen.clone();
        mouse.x -= window.innerWidth / 2;
        mouse.y -= window.innerHeight / 2;
        mouse.x /= window.innerWidth / 2;
        mouse.y /= -window.innerHeight / 2;
        mouse.unproject(this._camera.clone());
        mouse.sub(this._camera.position).normalize();
        const distance = -this._camera.position.z / mouse.z;
        this._mouseWorld = this._camera.position.clone();
        this._mouseWorld.add(mouse.multiplyScalar(distance));
        this._cursor.position.set(this._mouseWorld.x, this._mouseWorld.y, this._mouseWorld.z);
    }
    reset() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
        this._camera.position.z = this._cameraOffsetZ;
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._cursor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), this._cursorMaterial);
        this._cursor.renderOrder = 1;
        this._cursor.material.depthTest = false;
        this._scene.add(this._cursor);
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
