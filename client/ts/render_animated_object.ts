import * as THREE from 'three';

import { RenderObject } from './render_object.js'
import { Util } from './util.js'

import { renderer } from './renderer.js'

export class RenderAnimatedObject extends RenderObject {
	protected _mixer : THREE.AnimationMixer;
	protected _lastMixerUpdate : number;

	protected _actions : Map<string, THREE.AnimationAction>;

	// TODO: action groups
	protected _actionGroups : Map<string, Set<string>>;

	protected _activeActions : Set<string>;

	constructor(space : number, id : number) {
		super(space, id);


		this._lastMixerUpdate = Date.now();

		this._actions = new Map<string, THREE.AnimationAction>();
		this._actionGroups = new Map<string, Set<string>>();
		this._activeActions = new Set<string>();
	}

	override setMesh(mesh : THREE.Mesh) : void {
		super.setMesh(mesh);
		this._mixer = new THREE.AnimationMixer(mesh);
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!Util.defined(this._mixer)) {
			return;
		}

		const now = Date.now();
		const seconds = (now - this._lastMixerUpdate) / 1000;
		this._mixer.update(seconds)
		this._lastMixerUpdate = now;
	}

	protected initializeClip(action : string) : void {
		const mesh = this.mesh();
		const clip = this._mixer.clipAction(THREE.AnimationClip.findByName(mesh.animations, action));
		this.setWeight(clip, 1.0);
		clip.play();

		this._activeActions.add(action);
		this._actions.set(action, clip);
	}

	protected setWeight(action : any, weight : number) : void {
		action.enabled = true;
		action.setEffectiveTimeScale(1);
		action.setEffectiveWeight(weight);
	}

	protected fadeIn(action : string, duration : number) : void {
		if (!this._activeActions.has(action)) {
			this._actions.get(action).reset();
			this._actions.get(action).fadeIn(duration);
			this._activeActions.add(action);
		}
	}

	protected fadeOut(action : string, duration : number) : void {
		if (this._activeActions.has(action)) {
			this._actions.get(action).reset();
			this._actions.get(action).fadeOut(duration);
			this._activeActions.delete(action);
		}
	}

	protected fadeTo(startAction : string, endAction : string, duration : number) : void {
		this.fadeOut(startAction, duration);
		this.fadeIn(endAction, duration);
	}
}