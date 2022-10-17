import * as THREE from 'three';

import { game } from './game.js'
import { RenderCustom } from './render_custom.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { ChangeTracker } from './tracker.js'
import { MathUtil, Util } from './util.js'

export class GameOverlay extends SceneComponent {
	private readonly _pointerSize = 0.4;
	private readonly _pointerMesh = new THREE.Mesh(
		new THREE.ConeGeometry(this._pointerSize, this._pointerSize, 4, 1),
		new THREE.MeshToonMaterial( { color: 0xFFFF00, depthWrite: false, depthTest: false, transparent: true }));

	private _vip : RenderObject;
	private _vipPointer : RenderCustom;

	constructor() {
		super();

		this._vip = null;
		this._vipPointer = new RenderCustom(this.nextId());
		this._vipPointer.setMesh(this._pointerMesh);
		this._vipPointer.setUpdate((mesh : THREE.Object3D, ts : number) => {
			if (!Util.defined(this._vip)) {
				mesh.visible = false;
			} else {
				let camera = renderer.cameraController();
				let dir = this._vip.pos3().clone().sub(camera.target());

				let width = camera.width();
				let height = camera.height();
				let vipDim = this._vip.dim();
				if (Math.abs(dir.x) < width / 2 + vipDim.x / 2 && Math.abs(dir.y) < height / 2 + vipDim.y / 2) {
					mesh.visible = false;
				} else {
					mesh.visible = true;
					let angle = new THREE.Vector2(dir.x, dir.y).angle();
					mesh.rotation.z = - Math.PI / 2 + angle;

					dir.x = MathUtil.clamp(-width / 2 + this._pointerSize, dir.x, width / 2 - this._pointerSize);
					dir.y = MathUtil.clamp(-height / 2 + this._pointerSize, dir.y, height / 2 - this._pointerSize);
					dir.z = 0;
					mesh.position.copy(camera.target().clone().add(dir));
				}
			}
		});
		this.addCustom(this._vipPointer);
	}

	override postCamera() : boolean { return true; }

	override update() : void {
		super.update();

		if (game.state() === activeGameState) {
			if (Util.defined(this._vip) && (this._vip.deleted() || !this._vip.attribute(vipAttribute))) {
				this._vip = null;
			}

			if (!Util.defined(this._vip)) {
				this.initialize();
			}
		}
	}

	private initialize() : void {
		const players = game.sceneMap().getMap(playerSpace);
		for (let [id, player] of players) {
			if (player.attribute(vipAttribute)) {
				this._vip = player;
				break;
			}
		}
	}
}