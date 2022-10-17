import * as THREE from 'three';

import { game } from './game.js'
import { SpecialName } from './html.js'
import { options } from './options.js'
import { Particle } from './particles.js'
import { RenderCustom } from './render_custom.js'
import { RenderObject } from './render_object.js'
import { ui, TooltipType } from './ui.js'
import { Util } from './util.js'

export class RenderPortal extends RenderObject {
	private readonly _platformHeight = 0.05;

	private _bbox : THREE.Box2;
	private _particles : RenderCustom;

	constructor(space : number, id : number) {
		super(space, id);
		this.disableAutoUpdatePos();
	}

	override ready() : boolean {
		return super.ready() && this.hasIntAttribute(colorIntAttribute);
	}

	override initialize() : void {
		super.initialize();

		this._bbox = this.bbox();

		const dim = this.dim3();
		const initScale = new THREE.Vector3(1, 0.2 / dim.y, 0.1 / dim.z);
		const originalColor = new THREE.Color(this.intAttribute(colorIntAttribute));

		let mesh = new THREE.Mesh(new THREE.BoxGeometry(dim.x, this._platformHeight, dim.z), new THREE.MeshLambertMaterial({color: this.intAttribute(colorIntAttribute) }));
		mesh.position.copy(this.pos3());
		mesh.position.y -= dim.y / 2 - this._platformHeight / 2;

		this._particles = game.particles().emit(Particle.PORTAL, -1, (object : THREE.InstancedMesh, ts : number) => {
			for (let i = 0; i < object.count; ++i) {
				let matrix = new THREE.Matrix4();
				object.getMatrixAt(i, matrix);
				let pos = new THREE.Vector3();
				let rotation = new THREE.Quaternion();
				let scale = new THREE.Vector3();
				matrix.decompose(pos, rotation, scale);

				pos.y += 0.3 * ts;
				if (pos.y > 1) {
					pos.y = 0;
				}
				scale.y = initScale.y - 0.5 * pos.y * initScale.y;

				matrix.compose(pos, rotation, scale);
				object.setMatrixAt(i, matrix);

				let color = new THREE.Color();
				color.r = Math.min(1, originalColor.r + 1.2 * pos.y);
				color.g = Math.min(1, originalColor.g + 1.2 * pos.y);
				color.b = Math.min(1, originalColor.b + 1.2 * pos.y);
				object.setColorAt(i, color);
			}

			if (object.instanceMatrix) {
				object.instanceMatrix.needsUpdate = true;
			}
			if (object.instanceColor) {
				object.instanceColor.needsUpdate = true;
			}
		}, {
			position: mesh.position.clone(),
			scale: dim,
			instances: {
				posFn: (object, i) => {
					const level = Math.floor(i / 4);
					const totalLevels = Math.floor(object.count / 4);
					const index = i % 4;

					let x = 0, y = 0, z = 0;
					if (index === 0) {
						z = 0.5;
					} else if (index === 1) {
						x = 0.5;
					} else if (index === 2) {
						z = -0.5;
					} else if (index === 3) {
						x = -0.5;
					}

					y = level / totalLevels;
					return new THREE.Vector3(x, y, z)
				},
				rotationFn: (object, i) => {
					let q = new THREE.Quaternion();
					if (i % 2 === 1) {
						q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
					}
					return q;
				},
				scaleFn: (object, i) => {
					return initScale;
				},
			},
		})

		this.setMesh(mesh);
	}

	override delete() : void {
		super.delete();
		game.particles().delete(Particle.PORTAL, this._particles);
	}

	override update() : void {
		super.update();

		if (!this.initialized()) {
			return;
		}

		const player = game.player();
		if (Util.defined(player) && player.hasAttribute(canJumpAttribute)) {
			if (this._bbox.containsPoint(player.pos()) || this._bbox.intersectsBox(player.bbox())) {
				if (this.space() === goalSpace && player.byteAttribute(teamByteAttribute) !== this.byteAttribute(teamByteAttribute)) {
					ui.tooltip({
						type: TooltipType.GOAL,
						ttl: 500,
						names: [{
							text: "VIP",
							color: Util.colorString(vipColor),
						}]
					})
				}
			}
		}
	}
}

