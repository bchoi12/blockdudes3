import * as THREE from 'three';

import { RenderMesh } from './render_mesh.js'
import { renderer } from './renderer.js'
import { GameUtil } from './util.js'

export class RenderObject extends RenderMesh {
	protected _space : number;
	protected _id : number;

	protected _mixer : THREE.AnimationMixer;
	protected _lastMixerUpdate : number;

	protected _actions : Map<string, THREE.AnimationAction>;
	protected _activeActions : Set<string>;
	
	constructor(space : number, id : number) {
		super();

		this._space = space;
		this._id = id;

		this._activeActions = new Set();
		this._lastMixerUpdate = Date.now();
	}

	override update(msg : Map<number, any>) : void {
		super.update(msg);

		if (!this.hasMesh()) {
			return;
		}

		const mesh = this.mesh();
		const pos = this.pos();
		mesh.position.x = pos.x;
		mesh.position.y = pos.y;

	}

	override setMesh(mesh : THREE.Mesh) : void {
		super.setMesh(mesh);

		if (this._msg.hasOwnProperty(posProp)) {
			mesh.position.x = this._msg[posProp].X;
			mesh.position.y = this._msg[posProp].Y;
		}
		mesh.name = GameUtil.sid(this._space, this._id);
	}

	space() : number {
		return this._space;
	}

	id() : number {
		return this._id;
	}

	protected updateMixer() {
		const now = Date.now();
		const seconds = (now - this._lastMixerUpdate) / 1000;
		this._mixer.update(seconds)
		this._lastMixerUpdate = now;
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