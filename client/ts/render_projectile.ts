import * as THREE from 'three';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope.js'

import { Sound } from './audio.js'
import { game } from './game.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderProjectile extends RenderObject {
	private readonly _positionZ = 0.5;
	private readonly _trailGeometry = new PrismGeometry(new THREE.Shape([
		new THREE.Vector2(0, 0.5),
		new THREE.Vector2(-1, 0.25),
		new THREE.Vector2(-2, 0.08),
		new THREE.Vector2(-5, 0),
		new THREE.Vector2(-2, -0.08),
		new THREE.Vector2(-1, -0.25),
		new THREE.Vector2(0, -0.5),
	]), 0.1);

	private _sound : Sound;

	private _trail : THREE.Object3D;
	private _trailScalingFactor : number;

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasOwner() && this.hasDir();
	}

	override setMesh(mesh : THREE.Object3D) : void {
		super.setMesh(mesh);
		mesh.position.z = this._positionZ;
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		if (owner.valid() && owner.space() === playerSpace && game.sceneMap().has(owner.space(), owner.id())) {
			const player : RenderPlayer = game.sceneMap().getAsAny(owner.space(), owner.id());
			player.shoot();
		}

		if (Util.defined(this._sound)) {
			renderer.playSound(this._sound, this.pos());
		}
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const stopped = this.vel().lengthSq() == 0 || this.attribute(attachedAttribute);

		if (stopped) {
			this.mesh().position.z = 0;
		}

		if (this.mesh().position.z > 0) {
			this.mesh().position.z -= 2 * this.timestep();
		}

		if (Util.defined(this._trail)) {
			this._trail.rotation.z = this.dir().angle();

			if (stopped) {
				this._trail.scale.x = 0;
			} else if (Date.now() - this.initializeTime() > 30) {
				this._trail.scale.x += Math.min(this._trailScalingFactor * this.timestep(), 0.15);
			}
		}
	}

	protected setSound(sound : Sound) {
		this._sound = sound;
	}

	protected addTrail(material : THREE.Material, scalingFactor : number) : void {
		let gyro = new Gyroscope();
		this._trail = new THREE.Mesh(this._trailGeometry, material);
		this._trail.scale.y = this.dim().y;
		this._trail.scale.x = 0.05;
		gyro.add(this._trail);
		this.mesh().add(gyro);

		this._trailScalingFactor = scalingFactor;
	}

	protected getTrail() : THREE.Object3D {
		return this._trail;
	}
}

