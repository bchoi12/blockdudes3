import * as THREE from 'three'
import {Howl} from 'howler';

import { CameraController } from './camera_controller.js'
import { SceneMap } from './scene_map.js'
import { HtmlUtil } from './util.js'

import { options } from './options.js'

class Renderer {
	private readonly _rendererElm = "renderer";

	private _canvas : HTMLElement

	private _sceneMap : SceneMap;
	private _cameraController : CameraController;
	private _renderer : THREE.WebGLRenderer;

	private _mousePixels : THREE.Vector2;

	constructor() {
		this._canvas = HtmlUtil.elm(this._rendererElm);

		this._sceneMap = new SceneMap();
		this._cameraController = new CameraController(this._canvas.offsetWidth / this._canvas.offsetHeight);

		this._renderer = new THREE.WebGLRenderer({canvas: this._canvas, antialias: true});
		this._renderer.autoClear = false;
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
	sceneMap() : SceneMap { return this._sceneMap; }

	compile(mesh : THREE.Mesh) {
		this._renderer.compile(mesh, this._cameraController.camera());
	}

	render() : void {
		this._renderer.clear();
		this._sceneMap.updateComponents(this._cameraController.target())
		this._renderer.render(this._sceneMap.scene(), this._cameraController.camera());
	}
	
	setCamera(target : THREE.Vector3) : void {
		this._cameraController.setTarget(target);
	}

	setMouseFromPixels(mouse : any) : void {
		this._mousePixels = mouse.clone();
	}

	playSound(sound : Howl, pos : THREE.Vector3) : void {
		let dist = new THREE.Vector2(pos.x - this._cameraController.target().x, pos.y - this._cameraController.target().y);
		if (dist.lengthSq() <= 50) {
			sound.volume(1);
		} else {
			sound.volume(50 / dist.lengthSq());
		}
		sound.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		sound.play();
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