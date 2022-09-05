import * as THREE from 'three';

import { ObjectBuffer, ObjectOverrides } from './object_buffer.js'
import { PrismGeometry } from './prism_geometry.js'
import { RenderCustom } from './render_custom.js'
import { SceneComponent } from './scene_component.js'
import { MathUtil, Util } from './util.js'

export enum Particle {
	UNKNOWN = 0,
	SMOKE = 1,
	COLOR_TRAIL = 2,
	CUBE = 3,
	SPARKS = 4,
	LASER = 5,
}

export class Particles extends SceneComponent {
	private readonly _sphere = new THREE.SphereGeometry(1.0, 6, 6);
	private readonly _cube = new THREE.BoxGeometry(1, 1, 1);
	private readonly _plane = new THREE.PlaneGeometry(1, 1);
	private readonly _trail = new PrismGeometry(new THREE.Shape([
			new THREE.Vector2(0, 0.5),
			new THREE.Vector2(-1, 0.25),
			new THREE.Vector2(-2, 0.08),
			new THREE.Vector2(-5, 0),
			new THREE.Vector2(-2, -0.08),
			new THREE.Vector2(-1, -0.25),
			new THREE.Vector2(0, -0.5),
		]), 0.1);

	private readonly _smokeMaterial = new THREE.MeshLambertMaterial( {color: 0xb0b0b0} );
	private readonly _cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff})
	private readonly _sparksMaterial = new THREE.MeshBasicMaterial({
		opacity: 0.5,
		transparent: true,
		blending: THREE.AdditiveBlending,
		color: 0xffffff,
	});
	private readonly _laserMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });

	private _geometries : Map<Particle, THREE.BufferGeometry>;
	private _materials : Map<Particle, () => THREE.Material>;
	private _counts : Map<Particle, number>;
	private _emitters : Map<Particle, ObjectBuffer<THREE.Object3D>>;

	constructor() {
		super();

		this._geometries = new Map<Particle, THREE.BufferGeometry>();
		this._geometries.set(Particle.SMOKE, this._sphere);
		this._geometries.set(Particle.COLOR_TRAIL, this._trail);
		this._geometries.set(Particle.CUBE, this._cube);
		this._geometries.set(Particle.SPARKS, this._sphere);
		this._geometries.set(Particle.LASER, this._plane);

		this._materials = new Map<Particle, () => THREE.Material>();
		this._materials.set(Particle.SMOKE, () => { return this._smokeMaterial; });
		this._materials.set(Particle.COLOR_TRAIL, () => { return new THREE.MeshLambertMaterial(); })
		this._materials.set(Particle.CUBE, () => { return this._cubeMaterial; });
		this._materials.set(Particle.SPARKS, () => { return this._sparksMaterial; });
		this._materials.set(Particle.LASER, () => { return this._laserMaterial; });

		this._counts = new Map<Particle, number>();
		this._counts.set(Particle.SPARKS, 12);
		this._counts.set(Particle.LASER, 8);

		this._emitters = new Map<Particle, ObjectBuffer<THREE.Object3D>>();

		Object.keys(Particle).forEach((value) => {
			const num = Number(value);
			if (!isNaN(num) && num > 0) {
				this.createEmitter(num);
			}
		});
	}

	emit(particle : Particle, ttl : number, update : (object : THREE.Object3D, ts : number) => void, overrides? : ObjectOverrides) : RenderCustom {
		let obj = this._emitters.get(particle).getObject(overrides);
		let custom = new RenderCustom(this.nextId());
		custom.setMesh(obj);
		custom.setUpdate(update);
		this.addCustomTemp(custom, ttl, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
		return custom;
	}

	delete(particle : Particle, custom : RenderCustom) {
		if (!Util.defined(custom)) {
			return;
		}

		this.deleteCustomTemp(custom, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
	}

	private createEmitter(particle : Particle) : void {
		this._emitters.set(particle, new ObjectBuffer<THREE.Object3D>(() => {
			if (this._counts.has(particle)) {
				return this.createInstancedMesh(particle, this._counts.get(particle));
			}
			return this.createMesh(particle);
		}));
	}

	private createMesh(particle : Particle) : THREE.Mesh {
		return new THREE.Mesh(
			this._geometries.get(particle),
			this._materials.get(particle)(),
		);
	}

	private createInstancedMesh(particle : Particle, count : number) : THREE.InstancedMesh {
		return new THREE.InstancedMesh(
			this._geometries.get(particle),
			this._materials.get(particle)(),
			count,
		);
	}
}