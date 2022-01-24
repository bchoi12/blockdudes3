class Lighting {

	private readonly _shadowMapWidth = 1024;
	private readonly _shadowMapHeight = 1024;
	private readonly _shadowBias = -0.00018;

	private _scene : any;

	private _sunLight : any;
	private _sunLightOffset : any;

	constructor() {
		this._scene = new THREE.Scene();

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x232323, 1.8);
		this._scene.add(hemisphereLight);

		this._sunLight = new THREE.DirectionalLight(0xfdfbfd, 1.0);
		// this._sunLight = new THREE.DirectionalLight(0x6f6e92, 0.8);
		this._sunLightOffset = new THREE.Vector3(-50, 50, 50);
		this._sunLight.position.copy(this._sunLightOffset);
		this._sunLight.castShadow = true;
		
		const side = 10;
		this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500 );
		this._sunLight.shadow.mapSize.width = this._shadowMapWidth;
		this._sunLight.shadow.mapSize.height = this._shadowMapHeight;
		this._sunLight.shadow.bias = this._shadowBias;

		this._scene.add(this._sunLight);
		this._scene.add(this._sunLight.target);
	}

	scene() : any { return this._scene; }

	setTarget(position : any) : void {
		this._sunLight.target.position.copy(position);
	}
}