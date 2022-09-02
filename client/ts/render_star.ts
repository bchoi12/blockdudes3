import * as THREE from 'three';

import { Sound } from './audio.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderProjectile } from './render_projectile.js'
import { MathUtil } from './util.js'

export class RenderStar extends RenderProjectile {
	private readonly _prismGeometry = new PrismGeometry(new THREE.Shape([
		new THREE.Vector2(0, 0),
		new THREE.Vector2(-0.1, 0),
		new THREE.Vector2(-0.1, 0.2),
		new THREE.Vector2(0, 0.1),
	]), 0.2);

	private _materials : Array<THREE.MeshLambertMaterial>;

	constructor(space : number, id : number) {
		super(space, id);

		this._materials = new Array<THREE.MeshLambertMaterial>();

		this.setSound(Sound.THROW);
	}

	override ready() : boolean {
		return super.ready() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const group = new THREE.Group();
		const colorPair = [this.color(), Math.min(0xFFFFFF, this.color() + 0x42A11B)];

		this._materials.push(new THREE.MeshLambertMaterial({ color: colorPair[0] }));
		this._materials.push(new THREE.MeshLambertMaterial({ color: colorPair[1] }));

		for (let i = 0; i < 4; ++i) {
			const prismMesh = new THREE.Mesh(this._prismGeometry, new THREE.MeshLambertMaterial({ color: colorPair[i % 2]}));
			prismMesh.rotation.z = i * Math.PI / 2;
			group.add(prismMesh)
		}

		group.rotation.z = Math.random() * Math.PI;

		this.setMesh(group);
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);
		super.addTrail(this._materials[0], 0.5);
	}

	override update() : void {
		super.update()

		if (!this.hasMesh()) {
			return;
		}

		const mesh = this.mesh();
		const attached = this.attribute(attachedAttribute);
		if (!attached) {
			const vel = this.vel();
			mesh.rotation.z -= MathUtil.signPos(vel.x) * this.timestep() * 9;
		}
	}
}

