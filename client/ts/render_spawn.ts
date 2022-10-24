import * as THREE from 'three';

import { game } from './game.js'
import { options } from './options.js'
import { Particle } from './particles.js'
import { RenderCustom } from './render_custom.js'
import { RenderObject } from './render_object.js'
import { SpecialNames } from './special_name.js'
import { ui, TooltipType } from './ui.js'
import { Util } from './util.js'

export class RenderSpawn extends RenderObject {
	private static readonly chevron = new THREE.ExtrudeGeometry(new THREE.Shape([
		new THREE.Vector2(0, 0),
		new THREE.Vector2(-0.5, 0.5),
		new THREE.Vector2(0, 0.5),
		new THREE.Vector2(0.5, 0),
		new THREE.Vector2(0, -0.5),
		new THREE.Vector2(-0.5, -0.5),
	]), { depth: 1, bevelEnabled: false });

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasDir() && this.hasByteAttribute(teamByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		let group = new THREE.Group();
		for (let i = 0; i < 3; ++i) {
			const mesh = new THREE.Mesh(RenderSpawn.chevron, new THREE.MeshLambertMaterial({color: 0xFFFF00 }));
			mesh.position.x = (i - 1);
			mesh.position.z = -2;
			group.add(mesh);
		}

		if (this.dir().x < 0) {
			group.rotation.z = Math.PI;
		}

		this.setMesh(group);
	}
}

