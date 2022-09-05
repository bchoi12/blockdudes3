import * as THREE from 'three'
import SpriteText from 'three-spritetext';

import { game } from './game.js'
import { loader, Model, Typeface } from './loader.js'
import { Particle, Particles } from './particles.js'
import { RenderAnimatedObject } from './render_animated_object.js'
import { RenderCustom } from './render_custom.js'
import { RenderWeapon } from './render_weapon.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

// enum name has to be the same as value
enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
	Jump = "Jump",
}

export class RenderPlayer extends RenderAnimatedObject {
	private readonly _rotationOffset = -0.1;
	private readonly _cloudMaterial = new THREE.MeshLambertMaterial( {color: 0xdddddd } );

	private _name : SpriteText;
	private _playerMesh : THREE.Mesh;
	private _arm : THREE.Object3D;
	private _armOrigin : THREE.Vector3;

	private _weapon : RenderWeapon;
	private _lastGrounded : boolean;

	constructor(space : number, id : number) {
		super(space, id);

		this._lastGrounded = false;
	}

	override ready() : boolean {
		return super.ready()&& this.hasByteAttribute(typeByteAttribute) && this.hasName() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();

		loader.load(this.byteAttribute(typeByteAttribute) == 0 ? Model.CHICKEN : Model.DUCK, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		// @ts-ignore
		this._playerMesh = mesh.getObjectByName("mesh");
		// Model origin is at feet.
		this._playerMesh.position.y -= this.dim().y / 2;
		this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;

		this._arm = this.mesh().getObjectByName("armR");
		this._armOrigin = this._arm.position.clone();

		this._name = new SpriteText(this.name(), 0.3, "black");
		this._name.fontSize = 400;
		let size = new THREE.Vector3();
		const bbox = new THREE.Box3().setFromObject(this._name);
		bbox.getSize(size);
		this._name.position.y = 1.33;
		mesh.add(this._name);

		const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 4, 1), new THREE.MeshToonMaterial({ color: this.color() }));
		pointer.rotation.x = Math.PI;
		pointer.rotation.y = Math.PI / 4;
		pointer.position.y = 1.1;
		mesh.add(pointer);

		for (const action in PlayerAction) {
			this.initializeClip(PlayerAction[action]);
		}
		this.fadeOut(PlayerAction.Walk, 0);
		this.fadeOut(PlayerAction.Jump, 0);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const pos = this.pos3();
		const dim = this.dim();
		const vel = this.vel();
		const acc = this.acc();

		this.setDir(this.dir());
		this.setWeaponDir(this.hasWeapon() ? this._weapon.dir() : this.dir());

		if (this._arm.position.lengthSq() > 0) {
			let armOffset = this._armOrigin.clone().sub(this._arm.position);
			armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, this.timestep())));
			this._arm.position.add(armOffset);
		}

		const grounded = this.attribute(groundedAttribute);
		if (grounded != this._lastGrounded) {
			this._lastGrounded = grounded;

			[-1, 1].forEach((i : number) => {
				for (let j = 0; j < 3; j++) {
					const scale = MathUtil.randomRange(0.1, 0.7 * dim.x / 2);
					let cloud = game.particles().emit(Particle.SMOKE, MathUtil.randomRange(400, 600), (mesh : THREE.Object3D, ts : number) => {
						mesh.scale.multiplyScalar(0.9);
						mesh.position.x += i * mesh.scale.x * ts;
						mesh.position.y += 2 * mesh.scale.y * ts;
					}, {
						color: 0x7b7b7b,
						position: new THREE.Vector3(
							pos.x + i * scale,
							pos.y - dim.y / 2 + MathUtil.randomRange(-0.05, 0.05),
							pos.z + MathUtil.randomRange(-0.3, 0.3)),
						scale : scale,
					});
				}
			});
		}

		if (!grounded) {
			this.fadeOut(PlayerAction.Idle, 0.1);
			this.fadeOut(PlayerAction.Walk, 0.1);
			this.fadeIn(PlayerAction.Jump, 0.1);
		} else if (Math.abs(vel.x) > 0.1 && Math.sign(vel.x) == Math.sign(acc.x)) {
			this.fadeOut(PlayerAction.Idle, 0.2);
			this.fadeOut(PlayerAction.Jump, 0.2);
			this.fadeIn(PlayerAction.Walk, 0.2);
		} else {
			this.fadeOut(PlayerAction.Walk, 0.1);
			this.fadeOut(PlayerAction.Jump, 0.1);
			this.fadeIn(PlayerAction.Idle, 0.1);
		}
	}

	setWeapon(weapon : RenderWeapon) : void {
		if (!this.hasMesh()) {
			return;
		}
		this._weapon = weapon;

		this._arm.add(this._weapon.mesh());
		this._weapon.mesh().rotation.x = Math.PI / 2;
		this._weapon.mesh().scale.z = -1;
	}

	weapon() : RenderWeapon { return this._weapon; }
	hasWeapon() : boolean { return Util.defined(this._weapon) && this._weapon.weaponType() !== 0; }
	weaponType() : number { return this.hasWeapon() ? this._weapon.weaponType() : 0; }
	removeWeaponMesh() : void {
		if (this.hasWeapon()) {
			this._weapon.delete();
			this._arm.remove(this._weapon.mesh());
		}
	}

	shootingOrigin() : THREE.Vector3 {
		if (!this.hasMesh()) {
			return this.pos3();
		}

		const pos3 = this.mesh().position.clone();
		pos3.y += this._arm.position.y;
		pos3.y -= this.dim().y / 2;
		return pos3;
	}

	setWeaponDir(weaponDir : THREE.Vector2) {
		if (!this.hasMesh()) {
			return;
		}
		this._arm.rotation.x = weaponDir.angle() * Math.sign(-this._playerMesh.scale.z) + (this._playerMesh.scale.z < 0 ? Math.PI / 2 : 3 * Math.PI / 2);	
	}

	shoot() : void {
		if (!this.hasMesh()) {
			return;
		}

		const axis = new THREE.Vector3(1, 0, 0);
		const recoil = new THREE.Vector3(0, 0, -0.1);
		recoil.applyAxisAngle(axis, this._arm.rotation.x);

		this._arm.position.y = this._armOrigin.y - recoil.z;
		this._arm.position.z = this._armOrigin.z + recoil.y;
	}

	private setDir(dir : THREE.Vector2) {
		if (!this.hasMesh()) {
			return;
		}

		let neck = this.mesh().getObjectByName("neck");

		if (this.attribute(deadAttribute)) {
			neck.rotation.x = 0;
			this.mesh().rotation.z = MathUtil.signPos(this._playerMesh.scale.z) * Math.PI / 2;
			return;
		} else {
			this.mesh().rotation.z = 0;
			neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);

			if (MathUtil.signPos(dir.x) != MathUtil.signPos(this._playerMesh.scale.z)) {
				this._playerMesh.scale.z = MathUtil.signPos(dir.x);
			}
		}
	}
}