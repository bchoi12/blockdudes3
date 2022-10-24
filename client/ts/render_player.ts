import * as THREE from 'three'

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
import { SpecialName } from './special_name.js'
import { SpriteCreator } from './sprite_creator.js'
import { ChangeTracker } from './tracker.js'
import { ui, TooltipType } from './ui.js'
import { LogUtil, MathUtil, Util } from './util.js'

// enum name has to be the same as value
enum PlayerAction {
	Idle = "Idle",
	Walk = "Walk",
	Jump = "Jump",
}

export class RenderPlayer extends RenderAnimatedObject {
	private readonly _rotationOffset = -0.1;

	private _name : THREE.Sprite;
	private _pointer : THREE.Mesh;
	private _playerMesh : THREE.Mesh;
	private _arm : THREE.Object3D;
	private _armOrigin : THREE.Vector3;
	private _neck : THREE.Object3D;

	private _weapon : RenderWeapon;
	private _equip : RenderEquip;
	private _compass : THREE.Mesh;
	private _currentBlock : RenderBlock;

	private _teamTracker : ChangeTracker<number>;
	private _healthTracker : ChangeTracker<number>;
	private _jumpTracker : ChangeTracker<boolean>;
	private _doubleJumpTracker : ChangeTracker<boolean>;
	
	// TODO: combine with TeamTracker & change to color tracker?
	private _vipTracker : ChangeTracker<boolean>;
	private _panTracker : ChangeTracker<boolean>;

	private _hitDuration : number;
	private _lastHit : number;
	private _lastTears : number;
	private _tearInterval : number;
	private _tearLevel : number;

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

			if (Util.defined(renderer.cameraObject()) && this.spacedId().equals(renderer.cameraObject().spacedId()) && this.byteAttribute(teamByteAttribute) !== 0) {
				ui.tooltip( { 
					type: TooltipType.JOIN_TEAM,
					ttl: 5000,
					names: [this.getTeamName()],
				});
			}
		});
		this._healthTracker = new ChangeTracker<number>(() => {
			return this.byteAttribute(healthByteAttribute);
		}, (health : number, lastHealth : number) => {
			if (health === 0 || health > 60) {
				this._tearLevel = 0;
			} else {
				this._tearLevel = (70 - health) / 10;
				this._tearInterval = 750 + 250 * health / 20;
			}

			let lostHealth = Math.round(lastHealth - health);
			if (lostHealth > 0) {
				let scale = MathUtil.clamp(1, lostHealth / 40, 2);
				this._lastHit = Date.now();
				this._hitDuration = scale * 0.2;

				if (this.hasPos()) {
					let damageText = SpriteCreator.text("" + Math.round(lastHealth - health), {
						fontFace: "Impact",
						fontSize: 128,
						buffer: 0.1,
						color: Util.colorString(this.color()),
						shadow: "white",
						shadowBlur: 10,
					});

					let offset = new THREE.Vector3(
						MathUtil.randomRange(-0.8, 0.8),
						MathUtil.randomRange(1, 2),
						MathUtil.randomRange(-1, 1),
					);
					damageText.position.copy(this.pos3());
					damageText.position.add(offset);

					let vel = new THREE.Vector3(
						offset.x * scale,
						offset.y * scale,
						offset.z * scale,
					);
					damageText.scale.x *= scale
					damageText.scale.y *= scale;

					game.particles().emitObject(damageText, 800 * scale, (object : THREE.Object3D, ts : number) => {
						object.position.x += vel.x * ts;
						object.position.y += vel.y * ts;

						object.scale.x += 0.6 * vel.y * ts;
						object.scale.y += 0.6 * vel.y * ts;
						if (object.scale.x < 0) {
							object.scale.x = 0;
						}
						if (object.scale.y < 0) {
							object.scale.y = 0;
						}

						vel.y -= 10 * ts;
					});
				}
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
		this._vipTracker = new ChangeTracker<boolean>(() => {
			return this.attribute(vipAttribute);
		}, (vip : boolean) => {
			if (!Util.defined(this._pointer)) {
				return;
			}
			if (vip) {
				// @ts-ignore
				this._pointer.material.color = new THREE.Color(vipColor);
			} else {
				// @ts-ignore
				this._pointer.material.color = new THREE.Color(this.color());
			}
		});
		this._panTracker = new ChangeTracker<boolean>(() => {
			return this.id() === game.id()
				&& (Util.defined(renderer.cameraObject()) && this.id() === renderer.cameraObject().id())
				&& !this.attribute(deadAttribute)
				&& (Util.defined(this.weapon()) && this.weapon().byteAttribute(subtypeByteAttribute) === chargerEquip)
				&& game.keys().keyDown(altMouseClick);
		}, (pan : boolean) => {
			let camera = renderer.cameraController();
			const panEnabled = camera.panEnabled();
			if (pan && !panEnabled) {
				const mouseScreen = renderer.getMouseScreen();
				let pan = new THREE.Vector3(mouseScreen.x, mouseScreen.y, 0);
				pan.normalize();
				pan.multiplyScalar(10);
				camera.enablePan(pan);
			} else if (!pan && panEnabled) {
				camera.disablePan();		
			}
		})

		this._lastHit = 0;
		this._hitDuration = 0;
		this._lastTears = 0;
		this._tearLevel = 0;
		this._tearInterval = 4000;
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

	override delete() : void {
		super.delete();
		if (this.name().length > 0) {
			ui.print(this.name() + " was removed from the game.")
		}
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
		this._name = SpriteCreator.text(this.name(), {
			fontFace: "Lato",
			fontSize: 96,
			restrictWidth: true,
			buffer: 0.1,
			background: "rgba(33, 33, 33, 0.1)",
			color: "rgba(255, 255, 255, 1.0)",
		});
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
			if (Util.defined(this._currentBlock)) {
				if (this._currentBlock.deleted() || !this._currentBlock.containsObject(this)) {
					this._currentBlock = null;
				}
			}
			if (!Util.defined(this._currentBlock)) {
				const blocks = game.sceneMap().getMap(mainBlockSpace);
				blocks.forEach((block : RenderBlock) => {
					if (block.containsObject(this)) {
						this._currentBlock = block;
					}
				});
			}
		}
		if (Util.defined(this._currentBlock)) {
			this._name.visible = this._currentBlock.inside();
		} else {
			this._name.visible = true;
		}

		this._healthTracker.check();
		this._teamTracker.check();
		this._jumpTracker.check();
		this._doubleJumpTracker.check();
		this._vipTracker.check();
		this._panTracker.check();

		if (this._tearLevel > 0 && Date.now() - this._lastTears > this._tearInterval) {
			this.emitTears();
			this._lastTears = Date.now();
		}

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
		if (type === grapplingHookWeapon) {
			equipPos = this.mesh().getObjectByName("equip-head");
		}if (type === jetpackEquip) {
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

		let angle;
		if (Math.abs(this.dir().angle() - weaponDir.angle()) > Math.PI / 3 && this.dir().x !== weaponDir.x) {
			// Dir & weapon dir can get out of sync for AFK players.
			angle = this.dir().angle();
		} else {
			angle = weaponDir.angle();
		}

		this._arm.rotation.x = angle * Math.sign(-this._playerMesh.scale.z) + (this._playerMesh.scale.z < 0 ? Math.PI / 2 : 3 * Math.PI / 2);	
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
			this._name.material.rotation = this.mesh().rotation.z;
			return;
		} else {
			this._neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);
			this.mesh().rotation.z = 0;
			this._name.material.rotation = 0;

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

	private emitTears() : void {
		game.particles().emit(Particle.TEARS, 150 + 50 * this._tearLevel, (object : THREE.InstancedMesh, ts : number) => {
			object.position.copy(this.pos3());
			for (let i = 0; i < object.count; ++i) {
				let matrix = new THREE.Matrix4();
				object.getMatrixAt(i, matrix);
				let pos = new THREE.Vector3();
				let rotation = new THREE.Quaternion();
				let scale = new THREE.Vector3();
				matrix.decompose(pos, rotation, scale);

				let dir = new THREE.Vector3(0, -1, 0);
				dir.applyQuaternion(rotation);
				dir.multiplyScalar(4 / Math.max(1, Math.abs(6 * pos.x)) * ts);
				pos.add(dir);

				scale.sub(new THREE.Vector3(0.3 * ts, 0.3 * ts, 0.3 * ts));

				matrix.compose(pos, rotation, scale);
				object.setMatrixAt(i, matrix);
			}

			if (object.instanceMatrix) {
				object.instanceMatrix.needsUpdate = true;
			}
		}, {
			position: this.pos3(),
			rotation: new THREE.Euler(0, 0, this.dir().angle() + (this.dir().x < 0 ? Math.PI : 0)),
			scale: 1,
			instances: {
				posFn: (object, i) => {
					let sign = i % 2 === 0 ? -1 : 1;
					return new THREE.Vector3(
						sign * (0.8 - (i % 2) * 0.4),
						0.8 + Math.floor(i / 2) * 0.2,
						0,
					);						
				},
				scaleFn: (object, i) => {
					const scale = 0.1 + 0.04 * this._tearLevel;
					return new THREE.Vector3(scale, scale, scale);
				},
				rotationFn: (object, i) => {
					let sign = i % 2 === 0 ? -1 : 1;
					return new THREE.Euler(0, 0, (0.7 + Math.floor(i / 2) * 0.1) * sign * Math.PI);
				},
			}
		});
	}

	private getTeamName() : SpecialName {
		switch(this.byteAttribute(teamByteAttribute)) {
		case leftTeam:
			return {
				text: "left team",
				color: Util.colorString(leftTeamColor),
			};
		case rightTeam:
			return {
				text: "right team",
				color: Util.colorString(rightTeamColor),
			}
		default:
			return {
				text: "neutral team",
				color: Util.colorString(neutralTeamColor),
			}
		}
	}
}