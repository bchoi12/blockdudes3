import * as THREE from 'three';

import { EffectType } from './effects.js'
import { Sound } from './audio.js'
import { game } from './game.js'
import { RenderProjectile } from './render_projectile.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderPellet extends RenderProjectile {
	private readonly _material = new THREE.MeshPhongMaterial( {color: 0xfffc40 });
	private readonly _trailMaterial = new THREE.MeshPhongMaterial( {color: 0xfffc40 });

	constructor(space : number, id : number) {
		super(space, id);
		this.setSound(Sound.PEW);
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(this.dim().x / 2, this.dim().x / 2, 0.1, 8), this._material);
		mesh.rotation.x = Math.PI / 2;
		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();

		renderer.setEffect(EffectType.BLOOM, false, this.mesh());
		renderer.setEffect(EffectType.BLOOM, false, super.getTrail());
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);
		super.addTrail(this._trailMaterial, 0.7);

		renderer.setEffect(EffectType.BLOOM, true, mesh);
		renderer.setEffect(EffectType.BLOOM, true, super.getTrail());
	}
}

