import * as THREE from 'three';

import { Cardinal } from './cardinal.js'
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderBlock } from './render_block.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderMainBlock extends RenderBlock {
	constructor(space : number, id : number) {
		super(space, id);
	}

	override initialize() : void {
		super.initialize();

		let model;
		const type = this.byteAttribute(typeByteAttribute);
		switch (type) {
		case archBlock:
			model = Model.ARCH_BASE;
			break;
		default:
			console.error("Unknown block type: " + type);
			return;
		}

		this.loadMesh(model);
	}

	override update() : void {
		super.update();
	}
}