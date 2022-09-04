import * as THREE from 'three';

import { Sound } from './audio.js'
import { game } from './game.js'
import { Particle, Particles } from './particles.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderCustom } from './render_custom.js'
import { RenderProjectile } from './render_projectile.js'
import { MathUtil, Util } from './util.js'

export class RenderStar extends RenderProjectile {
	private readonly _prismGeometry = new PrismGeometry(new THREE.Shape([
		new THREE.Vector2(0, 0),
		new THREE.Vector2(-0.1, 0),
		new THREE.Vector2(-0.1, 0.2),
		new THREE.Vector2(0, 0.1),
	]), 0.2);

	private _materials : Array<THREE.MeshLambertMaterial>;
	private _trail : RenderCustom;

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

	override delete() : void {
		super.delete();

		if (Util.defined(this._trail)) {
			game.particles().delete(Particle.TRAIL, this._trail);
		}
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		this._trail = game.particles().emit(Particle.TRAIL, -1, (object : THREE.Object3D) => {
			object.position.copy(this.pos3());
			object.rotation.z = this.dir().angle();

			if (this.stopped()) {
				object.scale.x = 0;
			} else {
				object.scale.x = Math.min(object.scale.x + 0.7 * this.timestep(), 0.2);
			}
		}, {
			color: new THREE.Color(this.color()),
			scale: new THREE.Vector3(0.1, this.dim().y, 1),
		});
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

/*

	protected addTrail(material : THREE.Material, scalingFactor : number) : void {
		let gyro = new Gyroscope();
		this._trail = new THREE.Mesh(this._trailGeometry, material);
		this._trail.scale.y = this.dim().y;
		this._trail.scale.x = 0.1;

		gyro.add(this._trail);
		this.mesh().add(gyro);

		this._trailScalingFactor = scalingFactor;
	}

	protected getTrail() : THREE.Object3D {
		return this._trail;
	}

		if (Util.defined(this._trail)) {
			this._trail.rotation.z = this.dir().angle();

			if (stopped) {
				this._trail.scale.x = 0;
			} else if (Date.now() - this.initializeTime() > 30) {
				this._trail.scale.x = Math.min(this._trail.scale.x + this._trailScalingFactor * this.timestep(), 0.2);
			}
		}

*/