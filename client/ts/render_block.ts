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
	private _bbox : THREE.Box2;
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
			case tallBlockSubtype:
				model = Model.ARCH_TALL;
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
					if (components.has("transparent")) {
						material.transparent = true;
						material.opacity = 0.5;
					}
					if (components.has("front")) {
						this._frontMaterials.set(material, Util.defined(material.opacity) ? material.opacity : 1);
					}

					if (components.has("base")) {
						material.color = new THREE.Color(this.intAttribute(colorIntAttribute));
					} else if (components.has("secondary")) {
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
					if (components.has("left") && opening.get(leftCardinal)) {
						child.visible = false;
					}
					if (components.has("right") && opening.get(rightCardinal)) {
						child.visible = false;
					}
					if (components.has("bottom") && opening.get(bottomCardinal)) {
						child.visible = false;
					}
					if (components.has("top") && opening.get(topCardinal)) {
						child.visible = false;
					}
					if (components.has("bottomleft") && opening.get(bottomLeftCardinal)) {
						child.visible = false;
					}
					if (components.has("bottomright") && opening.get(bottomRightCardinal)) {
						child.visible = false;
					}
					if (components.has("topleft") && opening.get(topLeftCardinal)) {
						child.visible = false;
					}
					if (components.has("topright") && opening.get(topRightCardinal)) {
						child.visible = false;
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

				mat.opacity = Math.min(opacity, Math.max(0.2, mat.opacity + this.timestep() * (inside ? -3 : 5)));
			} else {
				mat.visible = !inside;
			}
		});
	}
}