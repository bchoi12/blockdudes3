import * as THREE from 'three';

import { EffectType } from './effects.js'
import { ForegroundGroup } from './foreground_group.js'
import { loader, Model } from './loader.js'
import { options } from './options.js'
import { PrismGeometry } from './prism_geometry.js'
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
				model = Model.TEST_BUILDING2;
				break;
			case roofBlockSubtype:
				model = Model.TEST_BUILDING2_ROOF;
				break;
			case balconyBlockSubtype:
				model = Model.TEST_BALCONY;
				break;
			}
		}

		const opening = this.byteAttribute(openingByteAttribute);
		loader.load(model, (mesh : THREE.Object3D) => {
			mesh.traverse((child) => {
				// @ts-ignore
				let material = child.material;
				if (material) {
					if (!material.visible) {
						return;
					}

					const name = material.name;
					if (name.includes("window")) {
						material.transparent = true;
						material.color = new THREE.Color(0x45d0ff);
						material.opacity = 0.5;
					}

					if (this.hasByteAttribute(openingByteAttribute)) {
						if (name.includes("left") && (opening & 1) === 1) {
							material.visible = false;
						}
						if (name.includes("right") && ((opening >> 1) & 1) === 1) {
							material.visible = false;
						}
						if (name.includes("bottom") && ((opening >> 2) & 1) === 1) {
							material.visible = false;
						}
					}

					if (name.includes("base")) {
						material.color = new THREE.Color(this.intAttribute(colorIntAttribute));
					} else if (name.includes("secondary")) {
						material.color = new THREE.Color(this.intAttribute(secondaryColorIntAttribute));
					}

					if (name.includes("front")) {
						this._frontMaterials.set(material, Util.defined(material.opacity) ? material.opacity : 1);
					}
					if (name.includes("back")) {
						material.color.r *= 0.8;
						material.color.g *= 0.8;
						material.color.b *= 0.8;
					}
				}
			});

			mesh.position.copy(this.pos3());

			if (model === Model.TEST_BALCONY) {
				if ((opening & 1) === 1) {
					mesh.rotation.set(0, Math.PI / 2, 0);
				} else if (((opening >> 1) & 1) === 1) {
					mesh.rotation.set(0, -Math.PI / 2, 0);
				}
			}

			this.setMesh(mesh);
		})


		const pos = this.pos();
		const dim = this.dim();
		this._bbox = new THREE.Box2(new THREE.Vector2(pos.x - dim.x/2, pos.y), new THREE.Vector2(pos.x + dim.x/2, pos.y + dim.y));
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const ts = this.timestep();
		const anchor = renderer.cameraAnchor();
		const inside = this._bbox.containsPoint(new THREE.Vector2(anchor.x, anchor.y));

		this._frontMaterials.forEach((opacity, mat) => {
			if (options.enableEffects) {
				if (inside && !mat.transparent) {
					mat.transparent = true;
				}

				mat.opacity = Math.min(opacity, Math.max(0.2, mat.opacity + ts * (inside ? -3 : 5)));
			} else {
				mat.visible = !inside;
			}
		});
	}
}