import * as THREE from 'three';

import { Sound } from './audio.js'
import { SceneComponentType } from './scene_component.js'
import { RenderObject } from './render_object.js'
import { RenderCustom } from './render_custom.js'
import { RenderPlayer } from './render_player.js'
import { MathUtil } from './util.js'

import { Model, loader } from './loader.js'
import { game } from './game.js'
import { renderer } from './renderer.js'

// TODO: this should be RenderRocket so other classes can inherit from RenderProjectile
export class RenderProjectile extends RenderObject {
	private readonly _smokeMaterial = new THREE.MeshStandardMaterial( {color: 0xbbbbbb , transparent: true, opacity: 0.5} );
	private readonly _smokeInterval = 15;
	private readonly _rotateZ = 0.12;
	private readonly _positionZ = 0.5;

	private _lastSmoke : number;

	constructor(space : number, id : number) {
		super(space, id);
		this._lastSmoke = 0;
	}

	// TODO: need to send owner as part of initialization?
	override ready() : boolean {
		return super.ready() && this.hasOwner();
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		if (owner.valid() && owner.space() === playerSpace) {
			const player : any = game.sceneMap().get(owner.space(), owner.id());
			player.shoot();
		}
		renderer.playSound(Sound.ROCKET, this.pos());
		loader.load(Model.ROCKET, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Mesh) : void {
		super.setMesh(mesh);
		mesh.rotation.y = Math.PI / 2;
		mesh.position.z = this._positionZ;
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		if (this.mesh().position.z > 0) {
			this.mesh().position.z -= .02;
		}

		const pos = this.pos();
		const vel = this.vel();
		const dim = this.dim();
		const dir = vel.clone().normalize();
		const angle = vel.angle() * -1;

		const projectile = this.mesh().getObjectByName("mesh");
		projectile.rotation.x = angle;
		projectile.rotateZ(this._rotateZ);

		if (Date.now() - this._lastSmoke >= this._smokeInterval) {
			const smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(MathUtil.randomRange(0.1, 0.2), 3, 3), this._smokeMaterial);
			smokeMesh.position.x = pos.x - dim.x / 2 * dir.x + MathUtil.randomRange(-0.1, 0.1);
			smokeMesh.position.y = pos.y - dim.y / 2 * dir.y + MathUtil.randomRange(-0.1, 0.1);
			smokeMesh.position.z = this._positionZ + MathUtil.randomRange(-0.1, 0.1);

			const smoke = new RenderCustom();
			smoke.setMesh(smokeMesh);
			smoke.setUpdate(() => {
				smoke.mesh().scale.multiplyScalar(0.9);
			});
			game.sceneComponent(SceneComponentType.PARTICLES).addCustomTemp(smoke, 400);

			this._lastSmoke = Date.now();
		}
	}
}

