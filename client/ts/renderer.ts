import * as THREE from 'three'

import { Audio, Sound } from './audio.js'
import { CameraController } from './camera_controller.js'
import { Effects, EffectType } from './effects.js'
import { game } from './game.js'
import { Html } from './html.js'
import { options } from './options.js'
import { Util } from './util.js'

class Renderer {
	private readonly _elmRenderer = "canvas-game";

	private _canvas : HTMLElement;
	private _audio : Audio;
	private _cameraController : CameraController;
	private _mousePixels : THREE.Vector2;

	private _renderCounter : number;
	private _fps : number;

	private _renderer : THREE.WebGLRenderer;
	private _effects : Effects;

	constructor() {
		this._canvas = Html.elm(this._elmRenderer);
		this._renderCounter = 0;
		this._fps = 0;
		this.updateFPS();

		this._audio = new Audio();
		this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);
		this._mousePixels = new THREE.Vector2(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2);

		window.onresize = () => { this.resize(); };
		this.reset();
	}

	reset() : void {
		this._renderer = new THREE.WebGLRenderer({
			canvas: this._canvas,
			powerPreference: "high-performance",
			precision: "lowp",
			antialias: !options.enableEffects && options.enableAntialiasing,
			stencil: false,
			depth: true,
		});

		this._renderer.setClearColor(0x91d6f2, 1.0);
		this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this._renderer.toneMappingExposure = 1.0;

		this._renderer.shadowMap.enabled = options.enableShadows;
		if (options.enableShadows) {
			this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		}

		this.resize();
	}

	resize() : void {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._renderer.setPixelRatio(options.rendererScale);

		this._canvas.style.width = width + "px";
		this._canvas.style.height = height + "px";

		this._cameraController.setAspect(width / height);

		if (Util.defined(this._effects)) {
			this._effects.reset(this._renderer);
		}
	}

	info() : any { return this._renderer.info; }
	elm() : HTMLElement { return this._canvas; }
	compile(scene : THREE.Scene) { this._renderer.compile(scene, this._cameraController.camera()); }
	render() : void {
		if (!Util.defined(this._effects)) {
			this._effects = new Effects(this._renderer);
		}

		if (options.enableEffects) {
			this._effects.render(game.sceneMap().scene(), this._cameraController.camera());
		} else {
			this._renderer.render(game.sceneMap().scene(), this._cameraController.camera());
		}
		
		this._renderCounter++;
	}
	fps() : number { return this._fps; }

	cameraController() : CameraController { return this._cameraController; }
	cameraAnchor() : THREE.Vector3 { return this._cameraController.anchor(); }
	cameraTarget() : THREE.Vector3 { return this._cameraController.target(); }
	setCameraAnchor(anchor : THREE.Vector3) : void { this._cameraController.setAnchor(anchor); }

	setEffect(effect : EffectType, enabled : boolean, object : THREE.Object3D) : void { this._effects.setEffect(effect, enabled, object); }

	playSystemSound(sound : Sound) : number { return this._audio.playSystemSound(sound); }
	playSound(sound : Sound, pos : THREE.Vector2) : number {
		const dist = new THREE.Vector2(pos.x - this._cameraController.anchor().x, pos.y - this._cameraController.anchor().y);
		return this._audio.playSound(sound, dist);
	}
	playSound3D(sound : Sound, pos : THREE.Vector3) : number {
		const dist = pos.clone();
		dist.sub(this._cameraController.anchor());
		return this._audio.playSound3D(sound, dist);
	}
	adjustSoundPos(sound : Sound, id : number, pos : THREE.Vector2) : void {
		const dist = new THREE.Vector2(pos.x - this._cameraController.anchor().x, pos.y - this._cameraController.anchor().y);
		return this._audio.adjustSoundDist(sound, dist, id);
	}
	stopSound(sound : Sound, id : number) : void {
		this._audio.stopSound(sound, id);
	}

	setMouseFromPixels(mouse : THREE.Vector2) : void { this._mousePixels = mouse.clone(); }
	getMouseScreen() : THREE.Vector2 {
		const mouse = this._mousePixels.clone();
		mouse.x -= window.innerWidth / 2;
		mouse.y -= window.innerHeight / 2;
		mouse.x /= window.innerWidth / 2;
		mouse.y /= -window.innerHeight / 2;
		return mouse;
	}

	getMouseWorld() : THREE.Vector3 {
		const mouseScreen = this.getMouseScreen();

		const mouse = new THREE.Vector3(mouseScreen.x, mouseScreen.y, 0);
		const camera = this._cameraController.camera();
		mouse.unproject(camera);
		mouse.sub(camera.position).normalize();

		const distance = -camera.position.z / mouse.z;
		const mouseWorld = camera.position.clone();
		mouseWorld.add(mouse.multiplyScalar(distance));
		return mouseWorld;
	}

	private updateFPS() : void {
		this._fps = this._renderCounter;
		this._renderCounter = 0;
		setTimeout(() => {
			this.updateFPS()
		}, 1000);
	}
}

export const renderer = new Renderer();