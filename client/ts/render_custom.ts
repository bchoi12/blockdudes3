import * as THREE from 'three';
import {Howl} from 'howler';

import { game } from './game.js'
import { RenderMesh } from './render_mesh.js'
import { renderer } from './renderer.js'

export class RenderCustom extends RenderMesh {

	private _id : number;
	private _lastUpdate : number;
	private _hasUpdate : boolean;
	private _update : (object : THREE.Object3D, timestep : number) => void;

	constructor(id : number) {
		super();

		this._id = id;
		this._lastUpdate = Date.now();
		this._hasUpdate = false;
	}

	id() : number { return this._id; }

	setUpdate(update : (object : THREE.Object3D, ts : number) => void) : void {
		this._hasUpdate = true;
		this._update = update;
	}

	update() : void {
		if (!this._hasUpdate) {
			return;
		}

		const ts = Math.min((Date.now() - this._lastUpdate) / 1000, .03) * game.updateSpeed();
		this._update(this.mesh(), ts);
		this._lastUpdate = Date.now();
	}
}

