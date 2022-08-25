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
		backWall.position.z = -this.dimZ() / 2 + thickness / 2;
		if (options.enableShadows) {
			backWall.castShadow = true;
			backWall.receiveShadow = true;
		}
		this._scene.add(backWall);

		let wallBuilder = new WallBuilder(this.dim(), thickness, this._frontMaterial);
		wallBuilder.addHole(
			new THREE.Path([
				wallBuilder.posFromPercent(0.14, 0),
				wallBuilder.posFromPercent(0.28, 0),
				wallBuilder.posFromPercent(0.28, 1),
				wallBuilder.posFromPercent(0.14, 1),
		]));

		wallBuilder.addHole(
			new THREE.Path([
				wallBuilder.posFromPercent(0.43, 0),
				wallBuilder.posFromPercent(0.57, 0),
				wallBuilder.posFromPercent(0.57, 1),
				wallBuilder.posFromPercent(0.43, 1),
		]));

		wallBuilder.addHole(
			new THREE.Path([
				wallBuilder.posFromPercent(0.7, 0),
				wallBuilder.posFromPercent(0.85, 0),
				wallBuilder.posFromPercent(0.85, 1),
				wallBuilder.posFromPercent(0.7, 1),
		]));

		let wall = wallBuilder.build();
		wall.position.z = this.dimZ() / 2 - thickness;
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