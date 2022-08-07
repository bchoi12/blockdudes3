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

import { Util } from './util.js'

export class Effects {

	private _initialized : boolean;
	private _composer : EffectComposer;

	private _bloomSelection : Selection;
	private _outlineSelection : Selection;

	constructor(renderer : THREE.WebGLRenderer) {
		this._initialized = false;
		this._composer = new EffectComposer(renderer);
	}

	render(scene : THREE.Scene, camera : THREE.Camera) : void {
		if (!this._initialized) {
			let selectiveBloom = new SelectiveBloomEffect(scene, camera, {
				blendFunction: BlendFunction.ADD,
				luminanceThreshold: 0.4,
				luminanceSmoothing: 0.6,
				intensity: 1.0,
			});
			selectiveBloom.ignoreBackground = true;
			this._bloomSelection = selectiveBloom.selection;

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
			this._outlineSelection = outline.selection;

			this._composer.addPass(new RenderPass(scene, camera));
			this._composer.addPass(new EffectPass(camera, selectiveBloom));
			this._composer.addPass(new EffectPass(camera, outline));
			this._composer.multisampling = 4;

			this._initialized = true;
		}

		this._composer.render();
	}

	addBloom(object : THREE.Object3D) : void {
		if (!Util.defined(this._bloomSelection)) {
			console.error("Attempting to add object bloom before effects initialization.")
			return;
		}
		this._bloomSelection.add(object);
	}

	removeBloom(object : THREE.Object3D) : void {
		if (!Util.defined(this._bloomSelection)) {
			console.error("Attempting to remove object bloom before effects initialization.")
			return;
		}
		this._bloomSelection.delete(object);
	}

	addOutline(object : THREE.Object3D) : void {
		if (!Util.defined(this._outlineSelection)) {
			console.error("Attempting to add object outline before effects initialization.")
			return;
		}

		console.log("added");
		console.log(object);
		this._outlineSelection.add(object);
	}

	removeOutline(object : THREE.Object3D) : void {
		if (!Util.defined(this._outlineSelection)) {
			console.error("Attempting to remove object outline before effects initialization.")
			return;
		}
		this._outlineSelection.delete(object);
	}
}