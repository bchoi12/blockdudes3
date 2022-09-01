import * as THREE from 'three';

import { options } from './options.js'
import { RenderCustom } from './render_custom.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { MathUtil, Util } from './util.js'

export class Weather extends SceneComponent {

	// TODO: shuffle these numbers and just iterate through them
	private readonly _cloudLengths : Array<number> = [5, 5.5, 6, 6.5];
	private readonly _cloudHeights : Array<number> = [0.5, 0.6, 0.7];
	private readonly _cloudDepths : Array<number> = [2.5, 3, 3.5];
	private readonly _cloudYs : Array<number> = [2, 4, 5, 6, 8, 10];
	private readonly _cloudZs : Array<number> = [-12, -9, 9];

	private _cloudMaterials : Array<THREE.Material>;

	constructor() {
		super();

		// TODO: instancing
		this._cloudMaterials = new Array<THREE.Material>();
		this._cloudMaterials.push(this.newCloudMaterial(0xeeeeee, MathUtil.randomRange(0.3, 0.5)));
		this._cloudMaterials.push(this.newCloudMaterial(0xe4e4e4, MathUtil.randomRange(0.3, 0.5)));
		this._cloudMaterials.push(this.newCloudMaterial(0xe0e0e0, MathUtil.randomRange(0.3, 0.5)));
		this._cloudMaterials.push(this.newCloudMaterial(0xd2d2d2, MathUtil.randomRange(0.4, 0.6)));


		for (let x = -5; x < 80; x += MathUtil.randomRange(10, 15)) {
			let cloud = new RenderCustom();
			cloud.setMesh(this.newCloudMesh(x));

			const speed = MathUtil.randomRange(0.6, 1);
			const updateCloud = (ts : number) => {
				cloud.mesh().position.x += speed * ts;
				if (cloud.mesh().position.x > 80) {
					cloud.mesh().position.x = -15;
				}
			};
			cloud.setUpdate(updateCloud);
			this.addCustom(cloud);
		}

	}

	override update() : void {
		super.update();
	}

	private newCloudMaterial(color : number, opacity : number) : THREE.MeshStandardMaterial {
		return new THREE.MeshStandardMaterial({
			transparent: true,
			shadowSide: THREE.FrontSide,
			color: color,
			opacity: opacity,
		});
	}

	private newCloudMesh(x : number) : THREE.Mesh {
		let cloud = new THREE.Mesh(
			new THREE.BoxGeometry(
				Util.randomElement(this._cloudLengths),
				Util.randomElement(this._cloudHeights),
				Util.randomElement(this._cloudDepths)),
			Util.randomElement(this._cloudMaterials));

		cloud.position.x = x;
		cloud.position.y = Util.randomElement(this._cloudYs);
		cloud.position.z = Util.randomElement(this._cloudZs);
		
		if (options.enableShadows) {
			cloud.castShadow = true;
		}
		return cloud;
	}
}