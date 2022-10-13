import * as THREE from 'three';

import { Cardinal } from './cardinal.js'
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderBlock } from './render_block.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderBalconyBlock extends RenderBlock {
	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasDir();
	}

	override initialize() : void {
		super.initialize();

		let model;
		const type = this.byteAttribute(typeByteAttribute);
		switch (type) {
		case archBlock:
			model = Model.ARCH_BALCONY;
			break;
		default:
			console.error("Unknown block type: " + type);
			return;
		}

		this.loadMesh(model, (mesh : THREE.Object3D) => {
			mesh.rotation.set(0, Math.sign(this.dir().x) * Math.PI / 2, 0);
		});
	}

	override update() : void {
		super.update();
	}
}