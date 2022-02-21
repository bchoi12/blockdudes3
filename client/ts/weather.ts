import * as THREE from 'three';

import { SceneComponent } from './scene_component.js'

export class Weather extends SceneComponent {
	private readonly _cloudMaterial = new THREE.MeshStandardMaterial( {color: 0xeeeeee, transparent: true, opacity: 0.7} );

	private _clouds : Array<THREE.Mesh>;

	constructor() {
		super();

		this._clouds = new Array<THREE.Mesh>();

		let cloud = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.0, 6.0), this._cloudMaterial);
		cloud.position.x = 6;
		cloud.position.y = 4;
		cloud.position.z = -12;
		cloud.castShadow = true;
		this._clouds.push(cloud);

		cloud = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.8, 6.0), this._cloudMaterial);
		cloud.position.x = -2;
		cloud.position.y = 2;
		cloud.position.z = -6;
		cloud.castShadow = true;
		this._clouds.push(cloud);

		cloud = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.0, 6.0), this._cloudMaterial);
		cloud.position.x = 2;
		cloud.position.y = 6;
		cloud.position.z = 4;
		cloud.castShadow = true;
		this._clouds.push(cloud);

		this._clouds.forEach((cloud) => {
			this._scene.add(cloud);
		});
	}

	update(position : THREE.Vector3) : void {
		this._clouds.forEach((cloud) => {
			cloud.position.x += 0.01;
		});
	}
}