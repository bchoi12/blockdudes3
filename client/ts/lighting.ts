import * as THREE from 'three';

import { SceneComponent } from './scene_component.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

export class Lighting extends SceneComponent {

	private readonly _shadowMapWidth = 1024;
	private readonly _shadowMapHeight = 1024;
	private readonly _shadowBias = -0.00018;

	private _sunLight : THREE.DirectionalLight;
	private _sunLightOffset : THREE.Vector3;

	constructor() {
		super();

		const sky = new Sky();
		sky.scale.setScalar(4000);
		const uniforms = sky.material.uniforms;
		uniforms['turbidity'].value = 20;
		uniforms['rayleigh'].value = 0.2;
		uniforms['mieCoefficient'].value = 0.00003;
		uniforms['mieDirectionalG'].value = 0.999;

		const sun = new THREE.Vector3();
		sun.setFromSphericalCoords(1, 1.45, -0.93 * Math.PI);
		uniforms['sunPosition'].value.copy( sun );
		this._scene.add(sky);

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x232323, 1.2);
		this._scene.add(hemisphereLight);

		this._sunLight = new THREE.DirectionalLight(0xfdfbfd, 2.0);
		// this._sunLight = new THREE.DirectionalLight(0x6f6e92, 0.8);
		this._sunLightOffset = new THREE.Vector3(-50, 50, 50);
		this._sunLight.position.copy(this._sunLightOffset);
		this._sunLight.castShadow = true;
		
		const side = 10;
		this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500 );
		this._sunLight.shadow.mapSize.width = this._shadowMapWidth;
		this._sunLight.shadow.mapSize.height = this._shadowMapHeight;
		this._sunLight.shadow.bias = this._shadowBias;

		this._scene.add(this._sunLight);
		this._scene.add(this._sunLight.target);
	}

	update(position : THREE.Vector3) : void {
		this._sunLight.target.position.copy(position);
	}
}