import * as THREE from 'three';

import { ObjectBuffer, ObjectOverrides } from './object_buffer.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderCustom } from './render_custom.js'
import { SceneComponent } from './scene_component.js'

export enum Particle {
	UNKNOWN = 0,
	SMOKE = 1,
	TRAIL = 2,
	PELLET = 3,
}

export class Particles extends SceneComponent {
	private readonly _smokeGeometry = new THREE.SphereGeometry(1.0, 6, 6);
	private readonly _smokeMaterial = new THREE.MeshLambertMaterial( {color: 0xb0b0b0} );

	private readonly _trailGeometry = new PrismGeometry(new THREE.Shape([
		new THREE.Vector2(0, 0.5),
		new THREE.Vector2(-1, 0.25),
		new THREE.Vector2(-2, 0.08),
		new THREE.Vector2(-5, 0),
		new THREE.Vector2(-2, -0.08),
		new THREE.Vector2(-1, -0.25),
		new THREE.Vector2(0, -0.5),
	]), 0.1);

	private readonly _pelletGeometry = new THREE.BoxGeometry(1, 1, 1);
	private readonly _pelletMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff})

	private _emitters : Map<Particle, ObjectBuffer<THREE.Object3D>>;

	constructor() {
		super();

		this._emitters = new Map<Particle, ObjectBuffer<THREE.Object3D>>();
		this._emitters.set(Particle.SMOKE, new ObjectBuffer<THREE.Object3D>(() => {
			return new THREE.Mesh(this._smokeGeometry, this._smokeMaterial);
		}));
		this._emitters.set(Particle.TRAIL, new ObjectBuffer<THREE.Object3D>(() => {
			return new THREE.Mesh(this._trailGeometry, new THREE.MeshLambertMaterial());
		}));
		this._emitters.set(Particle.PELLET, new ObjectBuffer<THREE.Object3D>(() => {
			return new THREE.Mesh(this._pelletGeometry, this._pelletMaterial);
		}));
	}

	emit(particle : Particle, ttl : number, update: (object : THREE.Object3D, ts : number) => void, overrides? : ObjectOverrides) : RenderCustom {
		let obj = this._emitters.get(particle).getObject(overrides);
		let custom = new RenderCustom(this.nextId());
		custom.setMesh(obj);
		custom.setUpdate(update);
		this.addCustomTemp(custom, ttl, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
		return custom;
	}

	delete(particle : Particle, custom : RenderCustom) {
		this.deleteCustomTemp(custom, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
	}
}