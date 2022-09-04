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
		return super.ready() && this.hasByteAttribute(typeByteAttribute); // && this.hasIntAttribute(colorIntAttribute)
	}

	override initialize() : void {
		super.initialize();

		let model;
		switch (this.byteAttribute(typeByteAttribute)) {
		case testBlock:
			model = Model.TEST_BUILDING;
			break;
		case archBlock:
			model = Model.TEST_BUILDING2;
			break;
		case archBlockRoof:
			model = Model.TEST_BUILDING2_ROOF;
			break;
		case archBlockBalcony:
			model = Model.TEST_BALCONY;
			break;
		}
		loader.load(model, (mesh) => {
			if (model !== Model.TEST_BUILDING) {
				mesh.traverse((child) => {
					if (child.material) {
						if (!child.material.visible) {
							return;
						}

						const name = child.material.name;
						if (name.includes("window")) {
							child.material.transparent = true;
							child.material.color = new THREE.Color(0x45d0ff);
							child.material.opacity = 0.5;
						}

						if (this.hasByteAttribute(openingByteAttribute)) {
							const opening = this.byteAttribute(openingByteAttribute);
							if (name.includes("left") && (opening & 1) === 1) {
								child.material.visible = false;
							}
							if (name.includes("right") && ((opening >> 1) & 1) === 1) {
								child.material.visible = false;
							}
						}

						if (name.includes("base")) {
							child.material.color = new THREE.Color(this.intAttribute(colorIntAttribute));
						} else if (name.includes("secondary")) {
							child.material.color = new THREE.Color(this.intAttribute(secondaryColorIntAttribute));
						}

						if (name.includes("front")) {
							this._frontMaterials.set(child.material, Util.defined(child.material.opacity) ? child.material.opacity : 1);
						}
						if (name.includes("back")) {
							child.material.color.sub(new THREE.Color(0x333333));
						}
					}
				});
			}

			mesh.position.copy(this.pos3());
			mesh.matrixAutoUpdate = false;
			mesh.updateMatrix();	
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