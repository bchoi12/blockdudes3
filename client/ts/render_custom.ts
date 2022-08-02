import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderMesh } from './render_mesh.js'
import { renderer } from './renderer.js'

export class RenderCustom extends RenderMesh {

	private _lastUpdate : number;
	private _hasUpdate : boolean;
	private _update : (timestep : number) => void;

	constructor() {
		super();

		this._lastUpdate = Date.now();
		this._hasUpdate = false;
	}

	setUpdate(update : (timestep : number) => void) : void {
		this._hasUpdate = true;
		this._update = update;
	}

	update() : void {
		if (!this._hasUpdate) {
			return;
		}

		const ts = (Date.now() - this._lastUpdate) / 1000;
		this._update(ts);
		this._lastUpdate = Date.now();
	}
}

