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
	private readonly _backMaterial = new THREE.MeshStandardMaterial( {color: 0x444444 } );

	private _bbox : THREE.Box2;
	private _frontMaterials : Map<THREE.Material, number>;
	private _foreground : ForegroundGroup;
	private _scene : THREE.Scene;

	constructor(space : number, id : number) {
		super(space, id);

		this._frontMaterials = new Map<THREE.Material, number>();
		this._foreground = new ForegroundGroup();
		this._scene = new THREE.Scene();
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
		}
		loader.load(model, (mesh) => {
			console.log(mesh);
			if (model === Model.TEST_BUILDING2 || model === Model.TEST_BUILDING2_ROOF) {
				mesh.traverse((child) => {
					if (child.material) {
						if (!child.material.visible) {
							return;
						}

						const name = child.material.name;

						if (name.includes("window")) {
							child.material.color = new THREE.Color(0x87e1ff);
							child.material.opacity = 0.7;
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
			this.setMesh(mesh);
		})


		const dim = this.dim();
		const pos = this.pos3();
		const thickness = this.thickness();

		this._bbox = new THREE.Box2(new THREE.Vector2(pos.x - dim.x/2, pos.y), new THREE.Vector2(pos.x + dim.x/2, pos.y + dim.y));

/*		let wallBuilder = new WallBuilder(this.dim(), thickness);

		if (Math.random() <= 0.5) {
			for (let i = 1; i <= 5; i += 2) {
				wallBuilder.addHole(
					new THREE.Path([
						wallBuilder.posFromPercent(i / 7, 0),
						wallBuilder.posFromPercent((i + 1) / 7, 0),
						wallBuilder.posFromPercent((i + 1) / 7, 1),
						wallBuilder.posFromPercent(i / 7, 1),
				]));
			}
		} else {
			for (let i = 1; i <= 5; i += 2) {
				wallBuilder.addHole(
					new THREE.Path([
						wallBuilder.posFromPercent(i / 7, .05),
						wallBuilder.posFromPercent((i + 1) / 7, .05),
						wallBuilder.posFromPercent((i + 1) / 7, .45),
						wallBuilder.posFromPercent(i / 7, .45),
				]));

				wallBuilder.addHole(
					new THREE.Path([
						wallBuilder.posFromPercent(i / 7, .55),
						wallBuilder.posFromPercent((i + 1) / 7, .55),
						wallBuilder.posFromPercent((i + 1) / 7, .95),
						wallBuilder.posFromPercent(i / 7, .95),
				]));
			}
		}

		let backWall = wallBuilder.build(this._backMaterial);
		backWall.position.z = pos.z - this.dimZ() / 2 + thickness;
		backWall.castShadow = false;
		backWall.receiveShadow = options.enableShadows;
		this._scene.add(backWall);

		let wall = wallBuilder.build(this._frontMaterial);
		wall.position.z = pos.z + this.dimZ() / 2 - thickness;
		wall.castShadow = options.enableShadows;
		wall.receiveShadow = options.enableShadows;
		this._foreground.add(wall);
	
		this._scene.add(this._foreground.scene());

 		this.setMesh(this._scene);
*/
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const anchor = renderer.cameraAnchor();
		const inside = this._bbox.containsPoint(new THREE.Vector2(anchor.x, anchor.y));

		this._frontMaterials.forEach((opacity, mat) => {
			mat.opacity = inside ? Math.max(0.2, mat.opacity - 3 * this.timestep()) : Math.min(opacity, mat.opacity + 3 * this.timestep());
		});
	}
}