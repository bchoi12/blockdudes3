import * as THREE from 'three';
import { RenderObject } from './render_object.js';
import { MathUtil, Util } from './util.js';
var PlayerAction;
(function (PlayerAction) {
    PlayerAction["Idle"] = "Idle";
    PlayerAction["Walk"] = "Walk";
    PlayerAction["Jump"] = "Jump";
})(PlayerAction || (PlayerAction = {}));
export class RenderPlayer extends RenderObject {
    constructor(space, id) {
        super(space, id);
        this._sqrtHalf = .70710678;
        this._rotationOffset = -0.1;
        this._pointsMaterial = new THREE.PointsMaterial({ color: 0x000000, size: 0.2 });
        this._lastUpdate = Date.now();
        this._grounded = true;
        this._actions = new Map();
    }
    setMesh(mesh) {
        this._mixer = new THREE.AnimationMixer(mesh);
        this._armOrigin = mesh.getObjectByName("armR").position.clone();
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
            mesh.add(this._profileMesh);
            const points = [];
            points.push(0, 0, 0);
            this._profilePoints = new THREE.BufferGeometry();
            this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
            this._profilePointsMesh = new THREE.Points(this._profilePoints, this._pointsMaterial);
            mesh.add(this._profilePointsMesh);
        }
        super.setMesh(mesh);
    }
    update(msg) {
        super.update(msg);
        if (!this.hasMesh()) {
            return;
        }
        const pos = this.pos();
        const vel = this.vel();
        const acc = this.acc();
        const dir = this.dir();
        const weaponDir = this.weaponDir();
        this.setDir(dir, weaponDir);
        const arm = this._mesh.getObjectByName("armR");
        if (arm.position.lengthSq() > 0) {
            let armOffset = this._armOrigin.clone().sub(arm.position);
            armOffset.setLength(Math.min(armOffset.length(), 0.4 * Math.max(0, (Date.now() - this._lastUpdate) / 1000)));
            arm.position.add(armOffset);
        }
        this._grounded = Util.getOr(msg, groundedProp, this._grounded);
        if (!this._grounded) {
            this.fadeOut(PlayerAction.Idle, 0.1);
            this.fadeOut(PlayerAction.Walk, 0.1);
            this.fadeIn(PlayerAction.Jump, 0.1);
        }
        else if (Math.abs(vel.x) > 0.1 && Math.sign(vel.x) == Math.sign(acc.x)) {
            this.fadeOut(PlayerAction.Idle, 0.2);
            this.fadeOut(PlayerAction.Jump, 0.2);
            this.fadeIn(PlayerAction.Walk, 0.2);
        }
        else {
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
                    points.push(point.X - pos.x, point.Y - pos.y, 0);
                });
                this._profilePoints.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
            }
        }
    }
    setDir(dir, weaponDir) {
        if (Math.abs(dir.x) < 0.3 && MathUtil.signPos(dir.x) != MathUtil.signPos(this.dir().x)) {
            dir.x = MathUtil.signPos(this.dir().x) * Math.abs(dir.x);
        }
        if (Math.abs(dir.x) < this._sqrtHalf) {
            dir.x = this._sqrtHalf * MathUtil.signPos(dir.x);
            dir.y = this._sqrtHalf * MathUtil.signPos(dir.y);
        }
        const player = this._mesh.getObjectByName("mesh");
        if (MathUtil.signPos(dir.x) != MathUtil.signPos(player.scale.z)) {
            player.scale.z = MathUtil.signPos(dir.x);
            player.rotation.y = Math.PI / 2 + Math.sign(player.scale.z) * this._rotationOffset;
        }
        const neck = player.getObjectByName("neck");
        neck.rotation.x = dir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI : 0);
        const arm = player.getObjectByName("armR");
        arm.rotation.x = weaponDir.angle() * Math.sign(-dir.x) + (dir.x < 0 ? Math.PI / 2 : 3 * Math.PI / 2);
    }
    setWeapon(weapon) {
        this._weapon = weapon;
        this._weapon.setParent(this);
        weapon.onMeshLoad(() => {
            this._mesh.getObjectByName("armR").add(weapon.mesh());
        });
    }
    shoot(shot) {
        const arm = this._mesh.getObjectByName("armR");
        const axis = new THREE.Vector3(1, 0, 0);
        const recoil = new THREE.Vector3(0, 0, -0.1);
        recoil.applyAxisAngle(axis, arm.rotation.x);
        arm.position.y = this._armOrigin.y - recoil.z;
        arm.position.z = this._armOrigin.z + recoil.y;
        if (Util.defined(this._weapon)) {
            this._weapon.shoot(shot);
        }
    }
}
