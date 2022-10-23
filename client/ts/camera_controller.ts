import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { CameraMode } from './renderer.js'
import { game } from './game.js'
import { Html } from './html.js'
import { Interp } from './interp.js'
import { RenderObject } from './render_object.js'
import { SpacedId } from './spaced_id.js'
import { Timer } from './timer.js'
import { MathUtil, Util } from './util.js'

// TODO: rename Spectator?
export class CameraController {
	// screen length = 25
	private readonly _horizontalFov = 45.2397;
	private readonly _cameraMinY = 1;
	private readonly _cameraOffset = new THREE.Vector3(0, 2.4, 30.0);
	private readonly _lookAtOffset = new THREE.Vector3(0, 0.5, 0);
	private readonly _panTiming = 250; // ms

	private _camera : THREE.PerspectiveCamera;
	private _mode : CameraMode;

	private _orbitControls : OrbitControls;
	private _object : RenderObject;
	private _target : THREE.Vector3;
	private _anchor : THREE.Vector3;

	private _seek : number;
	private _index : number;

	private _width : number;
	private _height : number;

	private _pan : THREE.Vector3;
	private _panTimer : Timer;
	private _panInterp : Interp;

	constructor(aspect : number) {
		this._camera = new THREE.PerspectiveCamera(20, aspect, 1, 200);
		this._mode = CameraMode.PLAYER;

		this._orbitControls = new OrbitControls(this._camera, Html.elm(Html.divOverlays));
		this._orbitControls.enableRotate = true;
		this._orbitControls.enablePan =  true;
		this._orbitControls.enableZoom = true;
		// @ts-ignore
		this._orbitControls.listenToKeyEvents(window);
		this._object = null;
		this._target = new THREE.Vector3();
		this._anchor = new THREE.Vector3();

		this._seek = 1;
		this._index = 0;

		this._width = 0;
		this._height = 0;

		this._pan = new THREE.Vector3();
		this._panTimer = new Timer(this._panTiming);
		this._panInterp = new Interp(0, 1);
		this._panInterp.capMax(true);
		this._panInterp.setFn((x: number) => { return -(x * x) + 2 * x; })

		this.setAnchor(this._anchor);
		this.setAspect(aspect);
	}

	camera() : THREE.PerspectiveCamera { return this._camera; }
	mode() : CameraMode { return this._mode }
	object() : RenderObject { return this._object; }
	objectId() : SpacedId { return Util.defined(this._object) ? this._object.spacedId() : SpacedId.invalidId(); }
	target() : THREE.Vector3 { return this._target; }
	anchor() : THREE.Vector3 { return this._anchor; }
	pan() : THREE.Vector3 { return this._pan; }
	panEnabled() : boolean { return this._panTimer.enabled(); }

	width() : number { return this._width; }
	height() : number { return this._height; }

	update() : void {
		switch (this._mode) {
		case CameraMode.PLAYER:
		case CameraMode.TEAM:
		case CameraMode.ANY_PLAYER:
			if (!Util.defined(this._object)) {
				this.setObject();
			}
			
			if (Util.defined(this._object)) {
				this.setAnchor(this._object.pos3());
			}
			break;
		case CameraMode.FREE:
			this._orbitControls.update();
			break;
		}
	}

	setMode(mode : CameraMode) {
		if (this._mode !== mode) {
			this._mode = mode;
			this.setObject();
		}
	}

	seek(inc : number) {
		this._seek = inc > 0 ? 1 : -1;
		this._index += inc;
		this.setObject();
	}

	enablePan(pan : THREE.Vector3) : void {
		this._pan = pan.clone();
		this._pan.y = MathUtil.clamp(-4, this._pan.y, 4);
		this._panTimer.start();
	}

	disablePan() : void {
		this._panTimer.reverse(2);
	}

	setAspect(aspect : number) {
		this._camera.aspect = aspect;
		this._camera.fov = Math.atan(Math.tan(this._horizontalFov * Math.PI / 360) / this._camera.aspect) * 360 / Math.PI;
		this._camera.updateProjectionMatrix();

		this._width = 2 * this._cameraOffset.z * Math.tan(this._horizontalFov * Math.PI / 360);
		this._height = 2 * this._cameraOffset.z * Math.tan(this._camera.fov * Math.PI / 360);
	}

	private setObject() : void {
		let player;

		switch (this._mode) {
		case CameraMode.PLAYER:
			this._object = game.player();
			break;
		case CameraMode.TEAM:
			player = game.player();
			if (Util.defined(player)) {
				const team = player.byteAttribute(teamByteAttribute);
				const teams = game.gameState().teams();

				const teammates = teams[team];
				if (!Util.defined(teammates)) {
					break;
				}

				let indices = new Set<number>();
				while (true) {
					this._index = this.safeIndex(teammates.length);
					if (indices.has(this._index)) {
						break;
					}
					
					indices.add(this._index);
					this._object = game.sceneMap().get(playerSpace, teammates[this._index]);

					if (!Util.defined(this._object) || this._object.id() === game.id()) {
						this._index += this._seek;
					} else if (Util.defined(this._object)) {
						break;
					}
				}
			}
			break;
		case CameraMode.ANY_PLAYER:
			const players = game.sceneMap().getMap(playerSpace);
			const keys = Array.from(players.keys());
 			const key = keys[this.safeIndex(keys.length)];
			this._object = players.get(key);
			break;
		}
	}

	private setAnchor(anchor: THREE.Vector3) : void {
		this._anchor = anchor.clone();

		this._target = this._anchor.clone();
		this._target.add(this._lookAtOffset);
		this._target.y = Math.max(this._cameraMinY, this._target.y);

		this._camera.position.copy(this._anchor);
		this._camera.position.add(this._cameraOffset);

		let pan = new THREE.Vector3();
		if (this._panTimer.enabled()) {
			const linearWeight = this._panTimer.weight();
			const weight = this._panInterp.get(linearWeight);

			pan = this._pan.clone();
			pan.multiplyScalar(weight);
		}

		this._camera.position.add(pan);
		this._target.add(pan);
		this._target.y = Math.max(this._cameraMinY, this._target.y);

		this._camera.position.y = Math.max(this._cameraMinY + this._cameraOffset.y, this._camera.position.y);
		this._camera.lookAt(this._target);
	}

	private safeIndex(size : number) : number {
		let index = this._index;
		if (index < 0) {
			index = size - 1;
		} else {
			index = index % size;
		}

		return index;
	}
}