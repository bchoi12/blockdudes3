import * as THREE from 'three'

import { CustomObject } from './custom_object.js'
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { Particle, Particles } from './particles.js'
import { RenderAnimatedObject } from './render_animated_object.js'
import { RenderBlock } from './render_block.js'
import { RenderCustom } from './render_custom.js'
import { RenderEquip } from './render_equip.js'
import { RenderObject } from './render_object.js'
import { RenderWeapon } from './render_weapon.js'
import { renderer } from './renderer.js'
import { ChangeTracker } from './tracker.js'
import { LogUtil, MathUtil, Util } from './util.js'

// enum name has to be the same as value
enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
	Jump = "Jump",
}

export class RenderPlayer extends RenderAnimatedObject {
	private readonly _rotationOffset = -0.1;

	private _name : THREE.Object3D;
	private _pointer : THREE.Mesh;
	private _playerMesh : THREE.Mesh;
	private _arm : THREE.Object3D;
	private _armOrigin : THREE.Vector3;
	private _neck : THREE.Object3D;

	private _weapon : RenderWeapon;
	private _equip : RenderEquip;

	private _teamTracker : ChangeTracker<number>;
	private _healthTracker : ChangeTracker<number>;
	private _jumpTracker : ChangeTracker<boolean>;
	private _doubleJumpTracker : ChangeTracker<boolean>;

	private _hitDuration : number;
	private _lastHit : number;

	constructor(space : number, id : number) {
		super(space, id);

		this._teamTracker = new ChangeTracker<number>(() => {
			return this.byteAttribute(teamByteAttribute);
		}, () => {
			if (!Util.defined(this._pointer)) {
				LogUtil.d("Changed teams before mesh was initialized.");
				return;
			}
			// @ts-ignore
			this._pointer.material.color = new THREE.Color(this.intAttribute(colorIntAttribute));
		});
		this._healthTracker = new ChangeTracker<number>(() => {
			return this.byteAttribute(healthByteAttribute);
		}, (health : number, lastHealth : number) => {
			if (health < lastHealth) {
				this._lastHit = Date.now();
				this._hitDuration = (lastHealth - health) / 25 * 0.2;
			}
		});
		this._jumpTracker = new ChangeTracker<boolean>(() => {
			return this.attribute(canJumpAttribute);
		}, () => {
			this.emitClouds(3);
		});
		this._doubleJumpTracker = new ChangeTracker<boolean>(() => {
			return this.attribute(canDoubleJumpAttribute);
		}, (canDoubleJump : boolean) => {
			if (!canDoubleJump) {
				this.emitClouds(1);
			}
		});

		this._lastHit = 0;
		this._hitDuration = 0;
	}

	override ready() : boolean {
		return super.ready() && this.hasByteAttribute(typeByteAttribute) && this.hasName() && this.hasColor();
	}

	override initialize() : void {
		super.initialize();

		loader.load(this.byteAttribute(typeByteAttribute) == 0 ? Model.CHICKEN : Model.DUCK, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		// Avoid z artifacts
		mesh.position.z = 0.01 * (this.id() % 7);

		// @ts-ignore
		this._playerMesh = mesh.getObjectByName("mesh");
		// Model origin is at feet.
		this._playerMesh.position.y -= this.dim().y / 2;
		this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;

		this._arm = this.mesh().getObjectByName("armR");
		this._armOrigin = this._arm.position.clone();
		this._neck = this.mesh().getObjectByName("neck");


		const pointerHeight = 0.2;
		this._name = CustomObject.nameSprite(this.name());
		this._name.position.y = this.dim().y + pointerHeight / 2;
		mesh.add(this._name);

		this._pointer = new THREE.Mesh(new THREE.ConeGeometry(pointerHeight, pointerHeight, 4, 1), new THREE.MeshToonMaterial({ color: this.color() }));
		this._pointer.rotation.x = Math.PI;
		this._pointer.rotation.y = Math.PI / 4;
		this._pointer.position.y = this.dim().y - pointerHeight;
		mesh.add(this._pointer);

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
		if (!this.hasWeapon()) {
			this.setWeaponDir(this.dir());
		}

		if (this._arm.position.lengthSq() > 0) {
			let armOffset = this._armOrigin.clone().sub(this._arm.position);
			armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, this.timestep())));
			this._arm.position.add(armOffset);
		}

		if (this.id() !== game.id()) {
		const blocks = game.sceneMap().getMap(blockSpace);
			blocks.forEach((block : RenderBlock) => {
				if (block.contains(this.pos())) {
					this._name.visible = block.inside();
				}
			});
		}

		this._healthTracker.check();
		this._teamTracker.check();
		this._jumpTracker.check();
		this._doubleJumpTracker.check();

		if ((Date.now() - this._lastHit) / 1000 <= this._hitDuration) {
			// @ts-ignore
			this._playerMesh.material.emissive = new THREE.Color(0xFFFFFF);
		} else {
			// @ts-ignore
			this._playerMesh.material.emissive = new THREE.Color(0x0);
		}

		if (!this._jumpTracker.value()) {
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

	setEquip(equip : RenderEquip) : void {
		if (!this.hasMesh()) {
			return;
		}

		const type = equip.byteAttribute(subtypeByteAttribute);
		let equipPos;
		if (type === jetpackEquip) {
			equipPos = this.mesh().getObjectByName("equip-back");
		} else if (type === boosterEquip) {
			equipPos = this.mesh().getObjectByName("equip-forehead");
		} else if (type === chargerEquip) {
			equipPos = this.mesh().getObjectByName("equip-eye");
		}
		
		if (Util.defined(equipPos)) {
			equip.mesh().position.copy(equipPos.position);
			let cur = this._neck;
			while (cur instanceof THREE.Bone) {
				equip.mesh().position.sub(cur.position);
				cur = cur.parent;
			}
			this._equip = equip;
			this._neck.add(this._equip.mesh());
		} else {
			LogUtil.d("Skipped equip due to missing position: " + type)
		}
	}

	weapon() : RenderWeapon { return this._weapon; }
	hasWeapon() : boolean { return Util.defined(this._weapon) && this._weapon.weaponType() !== 0; }
	weaponType() : number { return this.hasWeapon() ? this._weapon.weaponType() : 0; }

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

		if (this.attribute(deadAttribute)) {
			this._neck.rotation.x = 0;
			this.mesh().rotation.z = MathUtil.signPos(this._playerMesh.scale.z) * Math.PI / 2;
			return;
		} else {
			this.mesh().rotation.z = 0;
			this._neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);

			if (MathUtil.signPos(dir.x) != MathUtil.signPos(this._playerMesh.scale.z)) {
				this._playerMesh.scale.z = MathUtil.signPos(dir.x);
			}
		}
	}
	
	private emitClouds(num : number) : void {
		const pos = this.pos3();
		const dim = this.dim();
		[-1, 1].forEach((i : number) => {
			for (let j = 0; j < num; j++) {
				const scale = MathUtil.randomRange(0.1, 0.7 * dim.x / 2);
				let cloud = game.particles().emit(Particle.DUST, MathUtil.randomRange(400, 600), (mesh : THREE.Object3D, ts : number) => {
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
}