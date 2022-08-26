import * as THREE from 'three';

import { ForegroundGroup } from './foreground_group.js'
import { options } from './options.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { WallBuilder } from './wall_builder.js'

export class RenderBlock extends RenderObject {
	private readonly _backMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, shadowSide: THREE.FrontSide } );
	private readonly _frontMaterial = new THREE.MeshStandardMaterial( {color: 0x444444, transparent: true });

	private _bbox : THREE.Box2;
	private _foreground : ForegroundGroup;
	private _scene : THREE.Scene;

	constructor(space : number, id : number) {
		super(space, id);

		this._foreground = new ForegroundGroup();
		this._scene = new THREE.Scene();
	}

	override ready() : boolean {
		return super.ready() && this.hasDimZ() && this.hasThickness() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		if (this.byteAttribute(typeByteAttribute) === 2) {
			return;
		}

		const dim = this.dim();
		const pos = this.pos3();
		const thickness = this.thickness();

		this._bbox = new THREE.Box2(new THREE.Vector2(pos.x - dim.x/2, pos.y - dim.y/2), new THREE.Vector2(pos.x + dim.x/2, pos.y + dim.y/2));

		let backWall = new THREE.Mesh(new THREE.BoxGeometry(dim.x, dim.y, thickness), this._backMaterial);
		backWall.position.z = pos.z + -this.dimZ() / 2 + thickness / 2;
		if (options.enableShadows) {
			backWall.castShadow = true;
			backWall.receiveShadow = true;
		}
		this._scene.add(backWall);

		let wallBuilder = new WallBuilder(this.dim(), thickness, this._frontMaterial);

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

		let wall = wallBuilder.build();
		wall.position.z = pos.z + this.dimZ() / 2 - thickness;
		this._foreground.add(wall);
		this._scene.add(this._foreground.scene());

 		this.setMesh(this._scene);
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const anchor = renderer.cameraAnchor();
		const inside = this._bbox.containsPoint(new THREE.Vector2(anchor.x, anchor.y));
		this._foreground.setTransparent(inside);

		this._foreground.update(this.timestep());
	}
}