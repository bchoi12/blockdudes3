import * as THREE from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { Audio, Sound } from './audio.js'
import { CameraController } from './camera_controller.js'
import { game } from './game.js'
import { Html } from './html.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { Util } from './util.js'

class Renderer {
	private readonly _elmRenderer = "canvas-game";

	private _canvas : HTMLCanvasElement;
	private _audio : Audio;
	private _cameraController : CameraController;
	private _mousePixels : THREE.Vector2;

	private _renderCounter : number;
	private _fps : number;

	private _renderer : THREE.WebGLRenderer;

	private _fxaaPass : ShaderPass;
	private _effectsComposer : EffectComposer;
	private _effectsInitialized : boolean;

	constructor() {
		this._canvas = Html.canvasElm(this._elmRenderer);
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
			precision: "highp",
			antialias: false,
			depth: true,
		});

		this._renderer.setClearColor(0xFFFFFF, 1.0);
		this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this._renderer.toneMappingExposure = 1.0;

		this._renderer.shadowMap.enabled = options.enableShadows;
		if (options.enableShadows) {
			this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		}

		this._effectsComposer = new EffectComposer(this._renderer);
		this._fxaaPass = new ShaderPass(FXAAShader);
		this._effectsInitialized = false;
		this.resize();
	}

	resize() : void {
		if (options.resolution <= 0) {
			return;
		}

		const width = window.innerWidth;
		const height = window.innerHeight;
		const dpr = window.devicePixelRatio;

		const rendererWidth = width * options.resolution;
		const rendererHeight = height * options.resolution;
		this._renderer.setSize(rendererWidth, rendererHeight);
		this._renderer.setPixelRatio(dpr);

		this._canvas.width = rendererWidth * dpr;
		this._canvas.height = rendererHeight * dpr;
		this._canvas.style.transformOrigin = "0 0";
		this._canvas.style.transform = "scale(" + 1 / options.resolution + ")";

		this._cameraController.setAspect(width / height);

		const pixelRatio = this._renderer.getPixelRatio();
		this._fxaaPass.material.uniforms["resolution"].value.x = 1 / (width * dpr);
		this._fxaaPass.material.uniforms["resolution"].value.y = 1 / (height * dpr);
		this._effectsComposer.setSize(width, height);
	}

	domElement() : HTMLElement { return this._renderer.domElement; }
	info() : any { return this._renderer.info; }
	elm() : HTMLElement { return this._canvas; }
	compile(scene : THREE.Scene) { this._renderer.compile(scene, this._cameraController.camera()); }
	render() : void {
		if (options.enableAntialiasing) {
			if (!this._effectsInitialized) {
				const renderPass = new RenderPass(game.sceneMap().scene(), this._cameraController.camera());
				renderPass.clearColor = new THREE.Color(0, 0, 0);
				renderPass.clearAlpha = 0;
				this._effectsComposer.addPass(renderPass);
				this._effectsComposer.addPass(this._fxaaPass);
				this._effectsInitialized = true;
			}
			this._effectsComposer.render();
		} else {
			this._renderer.render(game.sceneMap().scene(), this._cameraController.camera());
		}
		this._renderCounter++;
	}
	fps() : number { return this._fps; }

	cameraController() : CameraController { return this._cameraController; }
	cameraObject() : RenderObject { return this._cameraController.object(); }
	cameraAnchor() : THREE.Vector3 { return this._cameraController.anchor(); }
	cameraTarget() : THREE.Vector3 { return this._cameraController.target(); }

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
	fadeoutSound(sound : Sound, id : number) : void { this._audio.fadeoutSound(sound, id); }
	stopSound(sound : Sound, id : number) : void { this._audio.stopSound(sound, id); }

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