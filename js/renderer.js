var Layer;
(function (Layer) {
    Layer[Layer["DEFAULT"] = 0] = "DEFAULT";
    Layer[Layer["BLOOM"] = 1] = "BLOOM";
})(Layer || (Layer = {}));
class Renderer {
    constructor(canvas) {
        this._cameraOffsetY = 1.2;
        this._cameraOffsetZ = 30.0;
        this._canvas = canvas;
        this._scene = new Scene();
        this._camera = new THREE.PerspectiveCamera(20, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
        this._camera.position.z = this._cameraOffsetZ;
        this._renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true });
        this._renderer.setClearColor(0x87cefa);
        this._renderer.shadowMap.enabled = true;
        this.resizeCanvas();
        window.onresize = () => { this.resizeCanvas(); };
        this._loader = new THREE.GLTFLoader();
        this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
    }
    elm() { return this._canvas; }
    render() {
        this._renderer.render(this._scene.scene(), this._camera);
    }
    setCamera(player, adj) {
        if (this._camera.position.distanceToSquared(player) < 1) {
            this._camera.position.x = player.x + adj.x;
            this._camera.position.y = Math.max(this._cameraOffsetY, player.y + adj.y + this._cameraOffsetY);
        }
        this._camera.position.x = player.x + adj.x;
        this._camera.position.y = player.y + adj.y + this._cameraOffsetY;
        this._camera.position.y = Math.max(this._camera.position.y, this._cameraOffsetY);
        this._scene.setPlayerPosition(player);
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
    scene() { return this._scene; }
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
