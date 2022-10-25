import * as THREE from 'three';

import { loader, Model } from './loader.js'
import { RenderBlock } from './render_block.js'

export class RenderHutBlock extends RenderBlock {
	constructor(space : number, id : number) {
		super(space, id);
	}

	override initialize() : void {
		super.initialize();

		let model;
		const type = this.byteAttribute(typeByteAttribute);
		switch (type) {
		case archBlock:
			model = Model.ARCH_HUT;
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