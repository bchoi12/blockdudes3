import * as THREE from 'three';

import { EffectType } from './effects.js'
import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js' 
import { LogUtil, Util } from './util.js'

export class RenderLight extends RenderObject {
	constructor(space : number, id : number) {
		super(space, id);
	}

	override ready() : boolean {
		let ready = super.ready()
		ready = ready && this.hasByteAttribute(typeByteAttribute) && this.hasIntAttribute(colorIntAttribute)
		ready = ready && this.hasFloatAttribute(intensityFloatAttribute) && this.hasFloatAttribute(distanceFloatAttribute);

		if (!ready) {
			return false;
		}

		const type = this.byteAttribute(typeByteAttribute);
		if (type === spotLight || type === floorLight) {
			ready = ready && this.hasFloatAttribute(fovFloatAttribute);
		}
		return ready;
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const intensity = this.floatAttribute(intensityFloatAttribute);
		const distance = this.floatAttribute(distanceFloatAttribute);
		const fov = this.floatAttribute(fovFloatAttribute);
		const color = this.intAttribute(colorIntAttribute);
		const secondaryColor = this.hasIntAttribute(secondaryColorIntAttribute) ? this.intAttribute(secondaryColorIntAttribute) : 0x6b6b6b;

		let scene = new THREE.Scene();
		let light, target, bulb, lamp, wire;

		switch (this.byteAttribute(typeByteAttribute)) {
		case pointLight:
			light = new THREE.PointLight(color, intensity, distance);
			break;
		case spotLight:
			light = new THREE.SpotLight(color, intensity, distance, fov);
			target = new THREE.Object3D();
			target.position.copy(new THREE.Vector3(0, -1, 0));

			const rad = dim.x / 3;
			bulb = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, rad, 12), new THREE.MeshStandardMaterial({color: color }));
			bulb.rotation.x = Math.PI / 2;

			const height = 0.6 * dim.x;
			lamp = new THREE.Mesh(new THREE.ConeGeometry(dim.x, height, 8, 1), new THREE.MeshStandardMaterial({color: secondaryColor }));
			lamp.position.y += height / 2;

			let wireGeometry = new THREE.BufferGeometry();
			const points = [
				light.position,
				new THREE.Vector3(0, dim.y / 2, 0),
			];
			wireGeometry.setFromPoints(points);

			wire = new THREE.Line(wireGeometry, new THREE.LineBasicMaterial({color: 0x000000}));
			wire.frustumCulled = false;
			break;
		case floorLight:
			light = new THREE.SpotLight(color, intensity, distance, fov);
			target = new THREE.Object3D();
			target.position.copy(new THREE.Vector3(0, 1, 0));

			bulb = new THREE.Mesh(new THREE.CylinderGeometry(dim.x / 2, dim.x / 2, dim.y, 12), new THREE.MeshStandardMaterial({color: color }));
			break;
		default:
			LogUtil.w("Unknown light type: " + this.byteAttribute(typeByteAttribute));
			return;
		}

		if (!Util.defined(light)) {
			return;
		}

		light.position.copy(new THREE.Vector3());
		scene.add(light);

		if (Util.defined(target)) {
			light.target = target
			scene.add(light.target);
		}

		if (Util.defined(bulb)) {
			renderer.setEffect(EffectType.BLOOM, true, bulb);
			scene.add(bulb);
		}
		if (Util.defined(lamp)) {
			scene.add(lamp);
		}
		if (Util.defined(wire)) {
			scene.add(wire);
		}

		this.setMesh(scene);
	}
}

