import * as THREE from 'three';

import { Sound } from './audio.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderProjectile } from './render_projectile.js'
import { MathUtil } from './util.js'

export class RenderPaperStar extends RenderProjectile {
	private readonly _prismGeometry = new PrismGeometry([
		new THREE.Vector2(0, 0),
		new THREE.Vector2(-0.1, 0),
		new THREE.Vector2(-0.1, 0.2),
		new THREE.Vector2(0, 0.1),
	], 0.2);

	private readonly _colorPairs = [
		[0xAD07DB, 0xEFA8F6],
	];

	constructor(space : number, id : number) {
		super(space, id);
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const group = new THREE.Group();
		const colorPair = this._colorPairs[Math.floor(this._colorPairs.length * Math.random())]
		for (let i = 0; i < 4; ++i) {
			const prismMesh = new THREE.Mesh(this._prismGeometry, new THREE.MeshStandardMaterial({ color: colorPair[i % 2]}));
			prismMesh.rotation.z = i * Math.PI / 2;
			group.add(prismMesh)
		}

		group.rotation.z = Math.random() * Math.PI;

		this.setMesh(group);
	}

	override update(msg : { [k: string]: any }, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		const mesh = this.mesh();
		const attached = this.attribute(attachedAttribute);
		if (!attached) {
			const vel = this.vel();
			mesh.rotation.z -= MathUtil.signPos(vel.x) * 0.1;
		}
	}
}

