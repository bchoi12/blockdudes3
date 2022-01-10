class Lighting {
    constructor() {
        this._shadowMapWidth = 1024;
        this._shadowMapHeight = 1024;
        this._shadowBias = -0.00018;
        this._scene = new THREE.Scene();
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x232323, 1.5);
        this._scene.add(hemisphereLight);
        this._sunLight = new THREE.DirectionalLight(0xfdfbfd, 2.0);
        this._sunLightOffset = new THREE.Vector3(-50, 50, 50);
        this._sunLight.position.copy(this._sunLightOffset);
        this._sunLight.castShadow = true;
        const side = 10;
        this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500);
        this._sunLight.shadow.mapSize.width = this._shadowMapWidth;
        this._sunLight.shadow.mapSize.height = this._shadowMapHeight;
        this._sunLight.shadow.bias = this._shadowBias;
        this._scene.add(this._sunLight);
        this._scene.add(this._sunLight.target);
    }
    scene() { return this._scene; }
    setTarget(position) {
        this._sunLight.target.position.copy(position);
    }
}