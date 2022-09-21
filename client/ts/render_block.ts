import * as THREE from 'three';

import { Cardinal } from './cardinal.js'
import { EffectType } from './effects.js'
import { ForegroundGroup } from './foreground_group.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'
import { WallBuilder } from './wall_builder.js'

export class RenderBlock extends RenderObject {
	private readonly _minOpacity = 0.1;

	private _bbox : THREE.Box2;
	private _windows : THREE.Object3D;
	private _frontMaterials : Map<THREE.Material, number>;

	constructor(space : number, id : number) {
		super(space, id);
		this._frontMaterials = new Map<THREE.Material, number>();
	}

	override ready() : boolean {
		return super.ready() && this.hasByteAttribute(typeByteAttribute) && this.hasByteAttribute(subtypeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		let model;
		switch (this.byteAttribute(typeByteAttribute)) {
		case archBlock:
			switch (this.byteAttribute(subtypeByteAttribute)) {
			case baseBlockSubtype:
				model = Model.ARCH_BASE;
				break;
			case roofBlockSubtype:
				model = Model.ARCH_ROOF;
				break;
			case balconyBlockSubtype:
				model = Model.ARCH_BALCONY;
				break;
			}
		}

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

			if (this.byteAttribute(subtypeByteAttribute) === balconyBlockSubtype) {
				if (opening.anyLeft()) {
					mesh.rotation.set(0, -Math.PI / 2, 0);
				} else if (opening.anyRight()) {
					mesh.rotation.set(0, Math.PI / 2, 0);
				}
			}

			this.setMesh(mesh);

			const pos = this.pos();
			const dim = this.dim();
			this._bbox = new THREE.Box2(new THREE.Vector2(pos.x - dim.x/2, pos.y), new THREE.Vector2(pos.x + dim.x/2, pos.y + dim.y));
		});
	}

	override update() : void {
		super.update();

		if (!this.hasMesh() || this._frontMaterials.size === 0 || !Util.defined(this._bbox)) {
			return;
		}

		const anchor = renderer.cameraAnchor();
		const inside = this._bbox.containsPoint(new THREE.Vector2(anchor.x, anchor.y));

		this._frontMaterials.forEach((opacity, mat) => {
			if (options.enableEffects) {
				if (inside && !mat.transparent) {
					mat.transparent = true;
				}
				mat.opacity = Math.min(opacity, Math.max(this._minOpacity, mat.opacity + this.timestep() * (inside ? -3 : 5)));
			} else {
				mat.visible = !inside;
			}
		});

		if (Util.defined(this._windows)) {
			this._windows.visible = !inside;
		}

	}
}