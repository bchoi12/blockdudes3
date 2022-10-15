import * as THREE from 'three';

import { Cardinal } from './cardinal.js'
import { game } from './game.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { RenderPlayer } from './render_player.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class RenderBlock extends RenderObject {
	private readonly _boxBuffer = -0.5;
	private readonly _minOpacity = 0.1;

	private _inside : boolean;
	private _bbox : THREE.Box2;
	private _windows : THREE.Object3D;
	private _frontMaterials : Map<THREE.Material, number>;

	constructor(space : number, id : number) {
		super(space, id);
		this._inside = false;
		this._frontMaterials = new Map<THREE.Material, number>();
	}

	override ready() : boolean {
		return super.ready() && this.hasByteAttribute(typeByteAttribute);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh() || this._frontMaterials.size === 0 || !Util.defined(this._bbox)) {
			return;
		}

		const object = renderer.cameraObject();
		if (object !== null) {
			this._inside = this.containsObject(object);
		} else {
			const anchor = renderer.cameraAnchor();
			this._inside = this.contains(new THREE.Vector2(anchor.x, anchor.y));
		}

		this._frontMaterials.forEach((opacity, mat) => {
			if (options.enableEffects) {
				if (this._inside && !mat.transparent) {
					mat.transparent = true;
				}
				mat.opacity = Math.min(opacity, Math.max(this._minOpacity, mat.opacity + this.timestep() * (this._inside ? -3 : 5)));
			} else {
				mat.visible = !this._inside;
			}
		});

		if (Util.defined(this._windows)) {
			this._windows.visible = !this._inside;
		}
	}

	inside() : boolean {
		return this._inside;
	}

	containsObject(object : RenderObject) {
		return this.contains(object.pos()) || this.bbox().intersectsBox(object.bbox());
	}

	contains(pos : THREE.Vector2) {
		if (!Util.defined(this._bbox)) {
			return false;
		}
		return this._bbox.containsPoint(pos);
	}

	protected loadMesh(model : Model, cb? : (mesh : THREE.Object3D) => void) : void {
		const opening = new Cardinal(this.byteAttribute(openingByteAttribute));
		loader.load(model, (mesh : THREE.Object3D) => {
			mesh.traverse((child) => {
				// @ts-ignore
				let material = child.material;
				if (material) {
					if (!material.visible) {
						return;
					}

					const name = material.name.toLowerCase();
					const components = new Set(name.split("-"));
					if (components.has("front")) {
						this._frontMaterials.set(material, Util.defined(material.opacity) ? material.opacity : 1);
					}

					if (components.has("base") && this.hasIntAttribute(colorIntAttribute)) {
						material.color = new THREE.Color(this.intAttribute(colorIntAttribute));
					} else if (components.has("secondary") && this.hasIntAttribute(secondaryColorIntAttribute)) {
						material.color = new THREE.Color(this.intAttribute(secondaryColorIntAttribute));
					}

					if (components.has("back")) {
						material.color.r *= 0.8;
						material.color.g *= 0.8;
						material.color.b *= 0.8;
					}
				}

				const name = child.name;
				const components = new Set(name.split("-"));
				if (components.has("opening") && this.hasByteAttribute(openingByteAttribute)) {
					if (opening.getCardinals(components).length > 0) {
						child.visible = false;
					}
				}

				if (components.has("windows")) {
					this._windows = child;
				}

				if (components.has("random")) {
					let valid = Math.random() < 0.5;
					if (valid && opening.getCardinals(components).length > 0) {
						valid = false;
					}

					if (valid) {
						let random = mesh.getObjectByName(name);
						loader.load(Math.random() < 0.66 ? Model.BEACH_BALL : Model.POTTED_TREE, (thing) => {
							thing.position.copy(random.position);
							mesh.add(thing);
						});
					}
				}

			});

			mesh.position.copy(this.pos3());

			if (Util.defined(cb)) {
				cb(mesh);
			}

			this.setMesh(mesh);

			if (this._frontMaterials.size > 0) {
				const pos = this.pos();
				const dim = this.dim();
				this._bbox = new THREE.Box2(
					new THREE.Vector2(pos.x - dim.x/2 - this._boxBuffer, pos.y - this._boxBuffer),
					new THREE.Vector2(pos.x + dim.x/2 + this._boxBuffer, pos.y + dim.y + this._boxBuffer));
			}
		});
	}
}