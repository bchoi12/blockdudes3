import * as THREE from 'three'

import { RenderObject } from './render_object.js'
import { RenderWeapon} from './render_weapon.js'
import { MathUtil, Util } from './util.js'

enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
	Jump = "Jump",
}

export class RenderPlayer extends RenderObject {
	private readonly _sqrtHalf = .70710678;
	private readonly _rotationOffset = -0.1;
	private readonly _pointsMaterial = new THREE.PointsMaterial( { color: 0x000000, size: 0.2} );

	private _weapon : RenderWeapon;
	private _armOrigin : THREE.Vector3;
	private _dir : THREE.Vector2;
	private _grounded : boolean;

	private _profileMesh : THREE.Mesh;
	private _profilePoints : THREE.BufferGeometry;
	private _profilePointsMesh : THREE.Points;

	constructor(mesh : THREE.Mesh) {
		super(mesh);
		this._mixer = new THREE.AnimationMixer(mesh);
		this._actions = new Map<PlayerAction, any>();

		this._armOrigin = mesh.getObjectByName("armR").position.clone();
		this._dir = new THREE.Vector2(1, 0);
		this._grounded = false;

		mesh.getObjectByName("mesh").rotation.y = Math.PI / 2 + this._rotationOffset;

		for (let action in PlayerAction) {
			const clip = this._mixer.clipAction(THREE.AnimationClip.findByName(mesh.animations, PlayerAction[action]));
			this.setWeight(clip, 1.0);
			clip.play();
			this._activeActions.add(action);
			this._actions.set(action, clip);
		}
		this.fadeOut(PlayerAction.Walk, 0);
		this.fadeOut(PlayerAction.Jump, 0);

		if (debugMode) {
			this._profileMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this._debugMaterial);
			this._mesh.add(this._profileMesh);

			const points = [];
			points.push(0, 0, 0);
			this._profilePoints = new THREE.BufferGeometry();
			this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

			this._profilePointsMesh = new THREE.Points(this._profilePoints, this._pointsMaterial);
			this._mesh.add(this._profilePointsMesh);
		}
	}

	setDir(dir : THREE.Vector2, weaponDir : THREE.Vector2) {
		if (Math.abs(dir.x) < 0.3 && MathUtil.signPos(dir.x) != MathUtil.signPos(this._dir.x)) {
			dir.x = MathUtil.signPos(this._dir.x) * Math.abs(dir.x);
		}

		if (Math.abs(dir.x) < this._sqrtHalf) {
			dir.x = this._sqrtHalf * MathUtil.signPos(dir.x);
			dir.y = this._sqrtHalf * MathUtil.signPos(dir.y);
		}

		const player = this._mesh.getObjectByName("mesh");
		if (MathUtil.signPos(dir.x) != MathUtil.signPos(player.scale.z)) {
			player.scale.z *= -1;
			player.rotation.y = Math.PI / 2 + Math.sign(player.scale.z) * this._rotationOffset;
		}

		const neck = player.getObjectByName("neck");
		let angle = new THREE.Vector3(dir.x > 0 ? 1 : -1, 0, 0).angleTo(new THREE.Vector3(dir.x, dir.y, 0));
		angle = MathUtil.normalize(angle) * -Math.sign(dir.y);
		neck.rotation.x = angle;

		let armAngle = new THREE.Vector3(weaponDir.x > 0 ? 1 : -1, 0, 0).angleTo(new THREE.Vector3(weaponDir.x, weaponDir.y, 0));
		armAngle = MathUtil.normalize(armAngle) * -Math.sign(weaponDir.y);
		const arm = player.getObjectByName("armR");
		arm.rotation.x = armAngle - Math.PI / 2;

		this._dir = dir;
	}

	setWeapon(weapon : RenderWeapon) : void {
		if (!Util.defined(this._weapon)) {
			this._mesh.getObjectByName("armR").add(weapon.mesh());
		}
		this._weapon = weapon;
	}

	shoot(shot : any) : void {
		const arm = this._mesh.getObjectByName("armR");
		const axis = new THREE.Vector3(1, 0, 0);
		const recoil = new THREE.Vector3(0, 0, -0.1);
		recoil.applyAxisAngle(axis, arm.rotation.x);

		arm.position.y = this._armOrigin.y - recoil.z;
		arm.position.z = this._armOrigin.z + recoil.y;

		this._weapon.shoot(shot);
	}

	override update(msg : any) : void {
		let pos = msg[posProp]
		this._mesh.position.x = pos.X;
		this._mesh.position.y = pos.Y;

		let dir = msg[dirProp];
		let weaponDir = msg[weaponDirProp];
		this.setDir(new THREE.Vector2(dir.X, dir.Y), new THREE.Vector2(weaponDir.X, weaponDir.Y));

		const arm = this._mesh.getObjectByName("armR");
		if (arm.position.lengthSq() > 0) {
			let armOffset = this._armOrigin.clone().sub(arm.position);
			armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, (Date.now() - this._lastUpdate) / 1000)));
			arm.position.add(armOffset);
		}

		this._grounded = Util.getOr(msg, groundedProp, this._grounded);
		const vel = Util.getOr(msg, velProp, {X: 0, Y: 0});
		const acc = Util.getOr(msg, accProp, {X: 0, Y: 0})
		if (!this._grounded) {
			this.fadeOut(PlayerAction.Idle, 0.1);
			this.fadeOut(PlayerAction.Walk, 0.1);
			this.fadeIn(PlayerAction.Jump, 0.1);
		} else if (Math.abs(vel.X) > 0.1 && Math.sign(vel.X) == Math.sign(acc.X)) {
			this.fadeOut(PlayerAction.Idle, 0.2);
			this.fadeOut(PlayerAction.Jump, 0.2);
			this.fadeIn(PlayerAction.Walk, 0.2);
		} else {
			this.fadeOut(PlayerAction.Walk, 0.1);
			this.fadeOut(PlayerAction.Jump, 0.1);
			this.fadeIn(PlayerAction.Idle, 0.1);
		}

		this._lastUpdate = Date.now();
		this.updateMixer();

		if (debugMode) {
			const profilePos = msg[profilePosProp];
			const profileDim = msg[profileDimProp];

			this._profileMesh.scale.x = profileDim.X;
			this._profileMesh.scale.y = profileDim.Y;

			if (msg.hasOwnProperty(profilePointsProp)) {
				const points = [];
				msg[profilePointsProp].forEach((point) => {
					points.push(point.X - pos.X, point.Y - pos.Y, 0);
				});
				this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
			}
		}
	}
}