import * as THREE from 'three'

import { game } from './game.js'
import { loader, Model } from './loader.js'
import { SceneComponentType } from './scene_component.js'
import { RenderAnimatedObject } from './render_animated_object.js'
import { RenderCustom } from './render_custom.js'
import { RenderWeapon} from './render_weapon.js'
import { ui } from './ui.js'
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
	private _lastUpdate : number;
	private _lastGrounded : boolean;

	private _playerMesh : THREE.Object3D;
	private _weapon : RenderWeapon;
	private _arm : THREE.Object3D;
	private _armOrigin : THREE.Vector3;

	private _profileMesh : THREE.Mesh;
	private _profilePoints : THREE.BufferGeometry;
	private _profilePointsMesh : THREE.Points;

	constructor(space : number, id : number) {
		// TODO: consider just using playerSpace
		super(space, id);

		this._weaponType = 0;
		this._weapon = new RenderWeapon();
		this._weapon.setParent(this);

		this._lastUpdate = Date.now();
		this._lastGrounded = false;
	}

	override initialize() : void {
		super.initialize();

		loader.load(this._id % 2 == 0 ? Model.CHICKEN : Model.DUCK, (mesh : THREE.Mesh) => {
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

		if (debugMode) {
			this._profileMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this._debugMaterial);
			mesh.add(this._profileMesh);

			const points = [];
			points.push(0, 0, 0);
			this._profilePoints = new THREE.BufferGeometry();
			this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

			this._profilePointsMesh = new THREE.Points(this._profilePoints, this._pointsMaterial);
			mesh.add(this._profilePointsMesh);
		}
	}

	override update(msg : Map<number, any>, seqNum? : number) : void {
		super.update(msg, seqNum);

		if (!this.hasMesh()) {
			return;
		}

		if (this.hasWeaponType()) {
			const weaponType = this.weaponType();
			if (this._weaponType != weaponType) {
				let model = Model.UNKNOWN;
				if (weaponType === uziWeapon) {
					model = Model.UZI;
				} else if (weaponType === bazookaWeapon) {
					model = Model.BAZOOKA;
				}

				if (model !== Model.UNKNOWN) {
					this._weaponType = weaponType;
					this.setWeapon(model);
				}
			}
		}

		// TODO: do this better
		if (msg.hasOwnProperty(killProp)) {
			ui.getClient(this.id()).setKills(msg[killProp]);
		}
		if (msg.hasOwnProperty(deathProp)) {
			ui.getClient(this.id()).setDeaths(msg[deathProp]);
		}

		const pos = this.pos();
		const dim = this.dim();
		const vel = this.vel();
		const acc = this.acc();

		this.setDir(this.dir());
		this.setWeaponDir(this.weaponDir());

		if (this._arm.position.lengthSq() > 0) {
			let armOffset = this._armOrigin.clone().sub(this._arm.position);
			armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, (Date.now() - this._lastUpdate) / 1000)));
			this._arm.position.add(armOffset);
		}

		const grounded = this.attribute(groundedAttribute);
		if (grounded != this._lastGrounded) {
			this._lastGrounded = grounded;

			if (vel.y >= 0) {
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

		this._lastUpdate = Date.now();

		if (debugMode) {
			const profilePos = msg[profilePosProp];
			const profileDim = msg[profileDimProp];

			this._profileMesh.scale.x = profileDim.X;
			this._profileMesh.scale.y = profileDim.Y;

			if (msg.hasOwnProperty(profilePointsProp)) {
				const points = [];
				msg[profilePointsProp].forEach((point) => {
					points.push(point.X - pos.x, point.Y - pos.y, 0);
				});
				this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
			}
		}
	}

	weaponPos() : THREE.Vector3 {
		if (!Util.defined(this._weapon) || !this._weapon.hasMesh()) {
			const pos = this.pos();
			return new THREE.Vector3(pos.x, pos.y, 0);
		}

		const pos = this.mesh().position.clone();
		pos.y += this._arm.position.y;
		pos.y += this._weapon.mesh().position.y;
		pos.y -= this.dim().y / 2;
		return pos;
	}

	setDir(dir : THREE.Vector2) {
		if (!this.hasMesh()) {
			return;
		}

		// TODO: use WASM to get extrapolated dir and delete this duplication
		// Match rotation with server logic
		const currentDir = this.dir();
		if (Math.abs(dir.x) < 0.3 && MathUtil.signPos(dir.x) != MathUtil.signPos(currentDir.x)) {
			dir.x = MathUtil.signPos(currentDir.x) * Math.abs(dir.x);
		}
		if (Math.abs(dir.x) < this._sqrtHalf) {
			dir.x = this._sqrtHalf * MathUtil.signPos(dir.x);
			dir.y = this._sqrtHalf * MathUtil.signPos(dir.y);
		}

		if (MathUtil.signPos(dir.x) != MathUtil.signPos(this._playerMesh.scale.z)) {
			this._playerMesh.scale.z = MathUtil.signPos(dir.x);
			this._playerMesh.rotation.y = Math.PI / 2 + Math.sign(this._playerMesh.scale.z) * this._rotationOffset;
		}

		const neck = this.mesh().getObjectByName("neck");
		neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);
	}

	setWeaponDir(weaponDir : THREE.Vector2) {
		if (!this.hasMesh()) {
			return;
		}
		this._arm.rotation.x = weaponDir.angle() * Math.sign(-this._playerMesh.scale.z) + (this._playerMesh.scale.z < 0 ? Math.PI / 2 : 3 * Math.PI / 2);	
	}

	setWeapon(model : Model) {
		if (this._weapon.hasMesh()) {
			this._arm.remove(this._weapon.mesh())
		}
		this._weapon.setModel(model);
	}

	shoot() : void {
		const axis = new THREE.Vector3(1, 0, 0);
		const recoil = new THREE.Vector3(0, 0, -0.1);
		recoil.applyAxisAngle(axis, this._arm.rotation.x);

		this._arm.position.y = this._armOrigin.y - recoil.z;
		this._arm.position.z = this._armOrigin.z + recoil.y;
	}
}