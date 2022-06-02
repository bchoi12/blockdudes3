import * as THREE from 'three';
import {Howl} from 'howler';

import { RenderMesh } from './render_mesh.js'
import { renderer } from './renderer.js'

export class RenderCustom extends RenderMesh {

	private _hasUpdate : boolean;
	private _update : () => void;

	constructor() {
		super();

		this._hasUpdate = false;
	}

	setUpdate(update : () => void) : void {
		this._hasUpdate = true;
		this._update = update;
	}

	update() : void {
		if (!this._hasUpdate) {
			return;
		}
		this._update();
	}
}
