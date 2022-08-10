import * as THREE from 'three'

import { game } from './game.js'
import { loader, Model } from './loader.js'
import { SceneComponentType } from './scene_component.js'
import { RenderAnimatedObject } from './render_animated_object.js'
import { RenderCustom } from './render_custom.js'
import { RenderWeapon} from './render_weapon.js'
import { renderer } from './renderer.js'
import { MathUtil, Util } from './util.js'

// enum name has to be the same as value
enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
	Jump = "Jump",
}

export class RenderPlayer extends RenderAnimatedObject {
	private readonly _sqrtHalf = .70710678;
	private readonly _rotationOffset = -0.1;
	private readonly _cloudMaterial = new THREE.MeshStandardMaterial( {color: 0xdddddd , transparent: true, opacity: 0.7} );
	private readonly _pointsMaterial = new THREE.PointsMaterial( { color: 0x000000, size: 0.2} );

	private _weaponType : number;
	private _lastGrounded : boolean;

	private _playerMesh : THREE.Object3D;
	private _weapon : RenderWeapon;
	private _arm : THREE.Object3D;
	private _armOrigin : THREE.Vector3;

	constructor(space : number, id : number) {
		super(space, id);

		this._weaponType = 0;
		this._weapon = new RenderWeapon();

		this._lastGrounded = false;
	}

	override initialize() : void {
		super.initialize();

		loader.load(this.id() % 2 == 0 ? Model.CHICKEN : Model.DUCK, (mesh : THREE.Mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		this._playerMesh = this.mesh().getObjectByName("mesh");
		// Model origin is at feet.
		this._playerMesh.position.y -= this.dim().y / 2;

		this._arm = this.mesh().getObjectByName("armR");
		this._armOrigin = this._arm.position.clone();
		this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;
		this._weapon.onMeshLoad(() => {
			this._arm.add(this._weapon.mesh());
		});

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

		if (this.hasWeaponType()) {
			const weaponType = this.weaponType();
			if (this._weaponType != weaponType) {
				this._weaponType = weaponType;
				const model = loader.getWeaponModel(weaponType);
				this.setWeapon(model);
			}
		}

		const pos = this.pos();
		const dim = this.dim();
		const vel = this.vel();
		const acc = this.acc();

		this.setDir(this.dir());
		this.setWeaponDir(this.weaponDir());

		if (this._arm.position.lengthSq() > 0) {
			let armOffset = this._armOrigin.clone().sub(this._arm.position);
			armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, this.timestep())));
			this._arm.position.add(armOffset);
		}

		const grounded = this.attribute(groundedAttribute);
		if (grounded != this._lastGrounded) {
			this._lastGrounded = grounded;

			// TODO: move this to particles?
			const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), this._cloudMaterial);
			cloudMesh.position.x = pos.x;
			cloudMesh.position.y = pos.y - dim.y / 2;
			cloudMesh.position.z = 0.5;
			const cloud = new RenderCustom();
			cloud.setMesh(cloudMesh);
			cloud.setUpdate(() => {
				cloud.mesh().scale.multiplyScalar(0.92);
			});
			game.sceneComponent(SceneComponentType.PARTICLES).addCustomTemp(cloud, 800);
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

	weaponPos() : THREE.Vector3 {
		if (!Util.defined(this._weapon) || !this._weapon.hasMesh() || !Util.defined(this._arm)) {
			const pos = this.pos();
			return new THREE.Vector3(pos.x, pos.y, 0);
		}

		const pos = this.mesh().position.clone();
		pos.y += this._arm.position.y;
		pos.y += this._weapon.mesh().position.y;
		pos.y -= this.dim().y / 2;
		return pos;
	}

	setWeapon(model : Model) {
		if (this._weapon.hasMesh() && Util.defined(this._arm)) {
			this._arm.remove(this._weapon.mesh())
		}
		this._weapon.setModel(model);
	}

	shoot() : void {
		if (!Util.defined(this._arm)) {
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

		if (MathUtil.signPos(dir.x) != MathUtil.signPos(this.mesh().scale.x)) {
			this.mesh().scale.x = MathUtil.signPos(dir.x);
		}

		const neck = this.mesh().getObjectByName("neck");
		neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);
	}

	private setWeaponDir(weaponDir : THREE.Vector2) {
		if (!this.hasMesh()) {
			return;
		}
		this._arm.rotation.x = weaponDir.angle() * Math.sign(-this.mesh().scale.x) + (this.mesh().scale.x < 0 ? Math.PI / 2 : 3 * Math.PI / 2);	
	}
}