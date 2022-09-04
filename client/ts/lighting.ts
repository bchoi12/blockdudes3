import * as THREE from 'three';

import { game } from './game.js'
import { options } from './options.js'
import { Range } from './range.js'
import { renderer } from './renderer.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

export class Lighting extends SceneComponent {

	private readonly _shadowMapWidth = 1024;
	private readonly _shadowMapHeight = 1024;
	private readonly _shadowBias = -0.00018;

	private readonly _sunHeightAngle = new Range(Math.PI / 4, Math.PI / 2 - 0.1);
	private readonly _turbidity = new Range(5.5, 2);
	private readonly _rayleigh = new Range(0.12, 0.02);
	private readonly _mieCoefficient = new Range(0.002, 0.005);
	private readonly _mieDirectionalG = new Range(0.999, 1);
	private readonly _sunLightIntensity = new Range(1.6, 0.5);
	private readonly _hemisphereLightIntensity = new Range(1, 0.7);

	private _sky : Sky;
	private _sunPos : THREE.Vector3;
	private _sunLight : THREE.DirectionalLight;
	private _sunLightOffset : THREE.Vector3;
	private _hemisphereLight : THREE.HemisphereLight;

	private _skyTime : number;

	constructor() {
		super();

		this._sky = new Sky();
		this._sky.scale.setScalar(4000);
		this.addObject(this._sky);

		this._sunPos = new THREE.Vector3();
		this._sunLight = new THREE.DirectionalLight(0xfdfbfd, 2.0);
		if (options.enableShadows) {
			this._sunLight.castShadow = true;
		}

		const side = 12;
		this._sunLight.shadow.camera = new THREE.OrthographicCamera(-side, side, side, -side, 0.1, 500 );
		this._sunLight.shadow.mapSize.width = this._shadowMapWidth;
		this._sunLight.shadow.mapSize.height = this._shadowMapHeight;
		this._sunLight.shadow.bias = this._shadowBias;
		this.addObject(this._sunLight);
		this.addObject(this._sunLight.target);
		
		this._hemisphereLight = new THREE.HemisphereLight(0xfdfbfd, 0x232323, 1.2);
		this.addObject(this._hemisphereLight);

		this.updateSky(0);
	}

	override update() : void {
		super.update();

		const cameraTarget = renderer.cameraTarget();
		this._sunLight.target.position.copy(cameraTarget);

		if (game.timeOfDay() > this._skyTime) {
			this._skyTime = game.timeOfDay();
			this.updateSky(this._skyTime);
		}
	}

	private updateSky(timeOfDay : number) : void {
		this._sunPos.setFromSphericalCoords(1, this._sunHeightAngle.lerp(timeOfDay),  -0.25 * Math.PI);

		let uniforms = this._sky.material.uniforms;
		uniforms['sunPosition'].value.copy(this._sunPos);
		uniforms['turbidity'].value = this._turbidity.lerp(timeOfDay);
		uniforms['rayleigh'].value = this._rayleigh.lerp(timeOfDay);
		uniforms['mieCoefficient'].value = this._mieCoefficient.lerp(timeOfDay);
		uniforms['mieDirectionalG'].value = this._mieDirectionalG.lerp(timeOfDay);

		this._sunLight.intensity = this._sunLightIntensity.lerp(timeOfDay);
		this._hemisphereLight.intensity = this._hemisphereLightIntensity.lerp(timeOfDay);

		this._sunLightOffset = this._sunPos.clone();

		// TODO: put this closer and tweak shadow bias or something
		this._sunLightOffset.multiplyScalar(86);
		this._sunLight.position.copy(this._sunLightOffset);

		this._skyTime = timeOfDay;
	}
}