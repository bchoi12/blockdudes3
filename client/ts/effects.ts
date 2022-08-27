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

import { options } from './options.js'
import { Util } from './util.js'

export enum EffectType {
	UNKNOWN = 0,
	MAIN = 1,
	BLOOM = 2,
	OUTLINE = 3,
}

export class Effects {

	private _initialized : boolean;
	private _composer : EffectComposer;
	private _selections : Map<EffectType, Selection>;

	constructor(renderer : THREE.WebGLRenderer) {
		this._initialized = false;
		this._composer = new EffectComposer(renderer);
		this._selections = new Map<EffectType, Selection>();
	}

	render(scene : THREE.Scene, camera : THREE.Camera) : void {
		if (!this._initialized) {
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

			this.setMultisampling(options.rendererMultisampling);
			this._initialized = true;
		}

		this._composer.render();
	}

	setMultisampling(multisampling : number) : void {
		this._composer.multisampling = multisampling;
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