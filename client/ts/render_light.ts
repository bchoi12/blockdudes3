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
		let ready = super.ready() && this.hasColor() && this.hasByteAttribute(typeByteAttribute) && this.hasByteAttribute(juiceByteAttribute);
		if (ready && (this.byteAttribute(typeByteAttribute) === spotLight || this.byteAttribute(typeByteAttribute) === floorLight)) {
			ready = ready && this.hasDir();
		}
		return ready;
	}

	override initialize() : void {
		super.initialize();

		const dim = this.dim();
		const dir = this.dir();
		const intensity = this.byteAttribute(juiceByteAttribute) / 10;

		let scene = new THREE.Scene();
		let light, bulb, lamp, target;

		switch (this.byteAttribute(typeByteAttribute)) {
		case pointLight:
			light = new THREE.PointLight(this.color(), intensity, dim.x);
			break;
		case spotLight:
			light = new THREE.SpotLight(this.color(), intensity, dim.x, 0.4 * Math.PI);
			light.position.y += 0.5;
			target = new THREE.Object3D();
			target.position.copy(new THREE.Vector3(dir.x, dir.y, 0));
			bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), new THREE.MeshStandardMaterial({color: this.color()}));
			bulb.rotation.x = Math.PI / 2;

			const height = 0.2;
			lamp = new THREE.Mesh(new THREE.ConeGeometry(0.3, height, 8, 1), new THREE.MeshStandardMaterial({color: Math.max(0, this.color() - 0x888888) }));
			lamp.position.y += height / 2;
			break;
		case floorLight:
			light = new THREE.SpotLight(this.color(), intensity, dim.x, 0.4 * Math.PI);
			target = new THREE.Object3D();
			target.position.copy(new THREE.Vector3(dir.x, dir.y, 0));

			bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), new THREE.MeshStandardMaterial({color: this.color()}));
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

		this.setMesh(scene);
	}
}

