import * as THREE from 'three'
import {
	BlendFunction,
	BloomEffect,
	EffectComposer,
	EffectPass,
	OutlineEffect,
	RenderPass,
	Selection,
	SelectiveBloomEffect,
} from "postprocessing";

import { game } from './game.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export enum EffectType {
	UNKNOWN = 0,
	MAIN = 1,
	BLOOM = 2,
	OUTLINE = 3,
}

export class Effects {

	private _webgl : THREE.WebGLRenderer;
	private _composer : EffectComposer;
	private _selections : Map<EffectType, Selection>;

	constructor(webgl : THREE.WebGLRenderer) {
		this._webgl = webgl;
		this._composer = new EffectComposer(this._webgl);
		this._selections = new Map<EffectType, Selection>();

		let scene = game.sceneMap().scene();
		let camera = renderer.cameraController().camera();

		let mainPass = new RenderPass(scene, camera);
		this._selections.set(EffectType.MAIN, mainPass.selection);

		let selectiveBloom = new SelectiveBloomEffect(scene, camera, {
			blendFunction: BlendFunction.ADD,
			luminanceThreshold: 0,
			luminanceSmoothing: 0.025,
			intensity: 1.5,
		});
		selectiveBloom.ignoreBackground = true;
		this._selections.set(EffectType.BLOOM, selectiveBloom.selection);

		let outline = new OutlineEffect(scene, camera, {
			blendFunction: BlendFunction.SCREEN,
			edgeStrength: 3,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0xFFFFFF,
			hiddenEdgeColor: 0x777777,
			resolutionScale: 1,
			blur: true,
			xRay: false,
		});
		this._selections.set(EffectType.OUTLINE, outline.selection);

		this._composer.addPass(mainPass);
		this._composer.addPass(new EffectPass(camera, selectiveBloom));
		this._composer.addPass(new EffectPass(camera, outline));
	}

	render(scene : THREE.Scene, camera : THREE.Camera) : void {
		if (this._composer.multisampling !== options.rendererMultisampling) {
			this._composer.multisampling = options.rendererMultisampling;
		}
	
		this._composer.render();
	}

	setEffect(effect : EffectType, enabled : boolean, object : THREE.Object3D) {
		if (!options.enableEffects) {
			return;
		}

		if (!this._selections.has(effect)) {
			console.error("Attempting to modify uninitialized effect " + effect);
			return;
		}

		if (enabled) {
			this._selections.get(effect).add(object);
		} else {
			this._selections.get(effect).delete(object);
		}
	}
}