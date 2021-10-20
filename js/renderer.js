class Renderer {
    constructor(canvas) {
        this._cameraOffsetY = 0.6;
        this._cameraOffsetZ = 6.0;
        this._canvas = canvas;
        this._scene = new Scene();
        this._camera = new THREE.PerspectiveCamera(75, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
        this._camera.position.z = this._cameraOffsetZ;
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.shadowMap.enabled = true;
        this._renderer.setClearColor(0xaaaaff);
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    render() { this._renderer.render(this._scene.scene(), this._camera); }
    setCamera(player, adj) {
        this._camera.position.x = player.x + adj.x;
        this._camera.position.y = player.y + adj.y + this._cameraOffsetY;
        this._scene.setSpotlightPosition(player.x, player.y, this._cameraOffsetZ);
        this._scene.setSpotlightTarget(player.x, player.y, player.z);
    }
    setMouseFromPixels(mouse) {
        this._mousePixels = mouse.clone();
    }
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
    addObject(type, id, mesh) { this._scene.addObject(type, id, mesh); }
    hasObject(type, id) { return this._scene.hasObject(type, id); }
    getObject(type, id) { return this._scene.getObject(type, id); }
    updatePlayer(id, msg) { this._scene.updatePlayer(id, msg); }
    updatePosition(type, id, x, y) { this._scene.updatePosition(type, id, x, y); }
    deleteObject(type, id) { this._scene.deleteObject(type, id); }
    clearObjects(type) { this._scene.clearObjects(type); }
    renderShots(shots) { this._scene.renderShots(shots); }
    resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderer.setSize(width / 1.5, height / 1.5);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
    }
}
