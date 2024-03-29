import * as THREE from 'three';

import { game } from './game.js'
import { KeyNames } from './key_names.js'
import { Model, loader } from './loader.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { SpecialName } from './special_name.js'
import { ui, TooltipType } from './ui.js'
import { Util } from './util.js'

export class RenderPickup extends RenderObject {
	private _bbox : THREE.Box2;

	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		return super.ready() && this.hasByteAttribute(typeByteAttribute);
	}

	override initialize() : void {
		super.initialize();

		this._bbox = this.bbox();

		const model = loader.getWeaponModel(this.byteAttribute(typeByteAttribute));
		loader.load(model, (mesh) => {
			this.setMesh(mesh);
		});
	}

	override setMesh(mesh : THREE.Object3D) {
		super.setMesh(mesh);

		mesh.position.z = -2;

		mesh.rotation.x = this.id() * 0.15 * Math.PI;
		mesh.rotation.y = this.id() * 0.3 * Math.PI;

		if (options.enableShadows) {
			mesh.receiveShadow = true;
		}
	}

	override update() : void {
		super.update();

		if (!this.hasMesh()) {
			return;
		}

		const player = game.player();
		if (Util.defined(player)) {
			if (this._bbox.containsPoint(player.pos()) || this._bbox.intersectsBox(player.bbox())) {
				ui.tooltip( { 
					type: TooltipType.PICKUP,
					ttl: 500,
					names: [this.getWeaponName()],
				});
			}
		}

		this.mesh().rotation.y += 1.2 * this.timestep();
		this.mesh().rotation.x += 0.6 * this.timestep();
	}

	private getWeaponName() : SpecialName {
		switch (this.byteAttribute(typeByteAttribute)) {
		case uziWeapon:
			return {
				text: "8-bit shotgun",
				color: "#00ff00",
			};
		case bazookaWeapon:
			return {
				text: "bazooka",
				color: "#ff0000",
			};
		case starWeapon:
			return {
				text: "exploding paper stars",
				color: "#ff00ff",
			};
		case sniperWeapon:
			return {
				text: "laser sniper",
				color: "#00ffff",
			};
		default:
			return {
				text: "unknown weapon",
			};
		}
	}
}

