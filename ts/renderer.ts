enum Layer {
	DEFAULT = 0,
	BLOOM = 1,
}

class Renderer {
	private readonly _cameraOffsetY = 1.2;
	private readonly _cameraOffsetZ = 12.0;

	private _canvas : HTMLElement

	private _scene : Scene;
	private _camera : any;
	private _renderer : any;
	private _composer : any;

	private _loader : any;

	private _mousePixels : any;

	constructor(canvas : HTMLElement) {
		this._canvas = canvas;

		this._scene = new Scene();
		this._camera = new THREE.PerspectiveCamera(45, this._canvas.offsetWidth / this._canvas.offsetHeight, 0.1, 1000);
		this._camera.position.z = this._cameraOffsetZ;

		this._renderer = new THREE.WebGLRenderer( {canvas: this._canvas, antialias: true});
		// this._renderer.setClearColor(0x3c3b5f);
		this._renderer.setClearColor(0x87cefa);
		this._renderer.shadowMap.enabled = true;

		this.resizeCanvas();
		window.onresize = () => { this.resizeCanvas(); };

		this._loader = new THREE.GLTFLoader();


/*
		const renderScene = null; // new THREE.RenderPass(this._scene, this._camera)			

		const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
		bloomPass.threshold = 0.21
		bloomPass.strength = 1.2
		bloomPass.radius = 0.55
		bloomPass.renderToScreen = true
			
		this._composer = new THREE.EffectComposer(this._renderer)
		this._composer.setSize(this._renderer.getSize().x, this._renderer.getSize().y);
		this._composer.addPass(renderScene)
		this._composer.addPass(bloomPass)
*/
		
		this._mousePixels = new THREE.Vector3(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2, 0);
	}

	elm() : HTMLElement { return this._canvas; }
	render() : void {
		this._renderer.render(this._scene.scene(), this._camera);
		// this._composer.render();
	}
	
	setCamera(player : any, adj : any) : void {
		if (this._camera.position.distanceToSquared(player) < 1) {
			this._camera.position.x = player.x + adj.x;
			this._camera.position.y = Math.max(this._cameraOffsetY, player.y + adj.y + this._cameraOffsetY);
		}

		this._camera.position.x = player.x + adj.x;
		this._camera.position.y = player.y + adj.y + this._cameraOffsetY;
		this._camera.position.y = Math.max(this._camera.position.y, this._cameraOffsetY);

		this._scene.setPlayerPosition(player);
	}

	setMouseFromPixels(mouse : any) : void {
		this._mousePixels = mouse.clone();
	}
	
	getMouseScreen() : any {
		const mouse = this._mousePixels.clone();
		mouse.x -= window.innerWidth / 2;
		mouse.y -= window.innerHeight / 2;
		mouse.x /= window.innerWidth / 2;
		mouse.y /= -window.innerHeight / 2;
		return mouse;
	}

	getMouseWorld() : any {
		const mouse = this.getMouseScreen();
		mouse.unproject(this._camera.clone());
		mouse.sub(this._camera.position).normalize();

		const distance = -this._camera.position.z / mouse.z;
		const mouseWorld = this._camera.position.clone();
		mouseWorld.add(mouse.multiplyScalar(distance));
		return mouseWorld;
	}

	scene() : any { return this._scene; }

	private resizeCanvas() : void {
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