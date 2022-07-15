import * as THREE from 'three'

import { Audio, Sound } from './audio.js'
import { CameraController } from './camera_controller.js'
import { game } from './game.js'
import { HtmlUtil } from './util.js'

import { options } from './options.js'

// TODO: rename to system or something
class Renderer {
	private readonly _elmRenderer = "canvas-game";

	private _canvas : HTMLElement;
	private _audio : Audio;
	private _cameraController : CameraController;
	private _renderer : THREE.WebGLRenderer;
	private _mousePixels : THREE.Vector2;

	constructor() {
		this._canvas = HtmlUtil.elm(this._elmRenderer);
		this._audio = new Audio();
		this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);
		this._renderer = new THREE.WebGLRenderer({canvas: this._canvas, antialias: true});
		this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this._renderer.toneMappingExposure = 1.0;

		if (options.enableShadows) {
			this._renderer.shadowMap.enabled = true;
			this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		}

		this.resizeCanvas();
		window.onresize = () => { this.resizeCanvas(); };

		this._mousePixels = new THREE.Vector2(this._canvas.offsetWidth / 2, this._canvas.offsetHeight / 2);
	}

	elm() : HTMLElement { return this._canvas; }

	compile(mesh : THREE.Mesh) {
		this._renderer.compile(mesh, this._cameraController.camera());
	}

	render() : void {
		this._renderer.render(game.sceneMap().scene(), this._cameraController.camera());
	}
	
	cameraController() : CameraController {
		return this._cameraController;
	}

	cameraTarget() : THREE.Vector3 {
		return this._cameraController.target();
	}
	setCameraTarget(target : THREE.Vector3) : void {
		this._cameraController.setTarget(target);
	}

	playSystemSound(sound : Sound) : void {
		this._audio.playSystemSound(sound);
	}
	playSound(sound : Sound, pos : THREE.Vector2) : void {
		const dist = new THREE.Vector2(pos.x - this._cameraController.target().x, pos.y - this._cameraController.target().y);
		this._audio.playSound(sound, dist);
	}
	playSound3D(sound : Sound, pos : THREE.Vector3) : void {
		const dist = pos.clone();
		dist.sub(this._cameraController.target());
		this._audio.playSound3D(sound, dist);
	}

	setMouseFromPixels(mouse : THREE.Vector2) : void {
		this._mousePixels = mouse.clone();
	}
	
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

	private resizeCanvas() : void {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width * options.rendererScale , height * options.rendererScale);
		this._renderer.setPixelRatio(window.devicePixelRatio);

		this._canvas.style.width = width + "px";
		this._canvas.style.height = height + "px";

		this._cameraController.setAspect(width / height);
	}
}

export const renderer = new Renderer();