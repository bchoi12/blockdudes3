import * as THREE from 'three';

import { ObjectBuffer, ObjectOverrides } from './object_buffer.js'
import { RenderCustom } from './render_custom.js'
import { SceneComponent } from './scene_component.js'
import { MathUtil, Util } from './util.js'

export enum Particle {
	UNKNOWN = 0,
	SMOKE = 1,
	DUST = 2,
	COLOR_TRAIL = 3,
	CUBE = 4,
	PELLET_SPARKS = 5,
	LASER = 6,
	LASER_SPARKS = 7,
	CONFETTI = 8,
	FINE_SMOKE = 9,
	LINES = 10,
	SMOKE_RING = 11,
	PORTAL = 12,
	TEARS = 13,
}

export class Particles extends SceneComponent {
	private readonly _sphere = new THREE.SphereGeometry(1.0, 6, 6);
	private readonly _fineSphere = new THREE.SphereGeometry(1.0, 12, 12);
	private readonly _cube = new THREE.BoxGeometry(1, 1, 1);
	private readonly _plane = new THREE.PlaneGeometry(1, 1);
	private readonly _torus = new THREE.TorusGeometry(1, 0.5, 16, 16);
	private readonly _trail = new THREE.ExtrudeGeometry(new THREE.Shape([
			new THREE.Vector2(0, 0.5),
			new THREE.Vector2(-1, 0.25),
			new THREE.Vector2(-2, 0.08),
			new THREE.Vector2(-5, 0),
			new THREE.Vector2(-2, -0.08),
			new THREE.Vector2(-1, -0.25),
			new THREE.Vector2(0, -0.5),
		]), { depth: 0.1, bevelEnabled: false });
	private readonly _tear;

	private readonly _smokeMaterial = new THREE.MeshLambertMaterial( {color: 0xfbfbfb } );
	private readonly _dustMaterial = new THREE.MeshLambertMaterial( {color: 0xbfbfbf } );
	private readonly _basicWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff})
	private readonly _sparksMaterial = new THREE.MeshBasicMaterial({
		opacity: 0.4,
		transparent: true,
		blending: THREE.AdditiveBlending,
		color: 0xbbbbbb,
	});
	private readonly _laserMaterial = new THREE.MeshBasicMaterial({ color: 0x060606 });
	private readonly _confettiMaterial = new THREE.MeshBasicMaterial( {
		side: THREE.DoubleSide,
		color: 0xffffff,
	});
	private readonly _tearMaterial = new THREE.MeshLambertMaterial({ color: 0xbefffd })

	private _geometries : Map<Particle, THREE.BufferGeometry>;
	private _materials : Map<Particle, () => THREE.Material>;
	private _sizes : Map<Particle, number>;
	private _counts : Map<Particle, number>;
	private _emitters : Map<Particle, ObjectBuffer<THREE.Object3D>>;

	constructor() {
		super();

		let tear = [];
		const tearSegments = 10;
		for (let i = 0; i <= tearSegments; ++i) {
			let t = i / tearSegments * Math.PI;
			let x = Math.sin(t / 2);
			tear.push(new THREE.Vector2(0.5 * Math.sin(t) * x * x, 0.5 * Math.cos(t)));
		}
		this._tear = new THREE.LatheGeometry(tear, 6);

		this._geometries = new Map<Particle, THREE.BufferGeometry>();
		this._geometries.set(Particle.SMOKE, this._sphere);
		this._geometries.set(Particle.DUST, this._sphere);
		this._geometries.set(Particle.COLOR_TRAIL, this._trail);
		this._geometries.set(Particle.CUBE, this._cube);
		this._geometries.set(Particle.PELLET_SPARKS, this._sphere);
		this._geometries.set(Particle.LASER, this._plane);
		this._geometries.set(Particle.LASER_SPARKS, this._cube);
		this._geometries.set(Particle.CONFETTI, this._plane);
		this._geometries.set(Particle.FINE_SMOKE, this._fineSphere);
		this._geometries.set(Particle.LINES, this._plane);
		this._geometries.set(Particle.SMOKE_RING, this._torus);
		this._geometries.set(Particle.PORTAL, this._cube);
		this._geometries.set(Particle.TEARS, this._tear);

		this._materials = new Map<Particle, () => THREE.Material>();
		this._materials.set(Particle.SMOKE, () => { return this._smokeMaterial; });
		this._materials.set(Particle.DUST, () => { return this._dustMaterial; });
		this._materials.set(Particle.COLOR_TRAIL, () => { return new THREE.MeshLambertMaterial(); })
		this._materials.set(Particle.CUBE, () => { return this._basicWhiteMaterial; });
		this._materials.set(Particle.PELLET_SPARKS, () => { return this._sparksMaterial; });
		this._materials.set(Particle.LASER, () => { return this._laserMaterial; });
		this._materials.set(Particle.LASER_SPARKS, () => { return this._sparksMaterial; });
		this._materials.set(Particle.CONFETTI, () => { return this._confettiMaterial; });
		this._materials.set(Particle.FINE_SMOKE, () => { return this._smokeMaterial; });
		this._materials.set(Particle.LINES, () => { return this._basicWhiteMaterial; });
		this._materials.set(Particle.SMOKE_RING, () => { return this._smokeMaterial; });
		this._materials.set(Particle.PORTAL, () => { return this._basicWhiteMaterial; });
		this._materials.set(Particle.TEARS, () => { return this._tearMaterial; });

		this._sizes = new Map<Particle, number>();
		this._sizes.set(Particle.DUST, 24);
		this._sizes.set(Particle.CUBE, 18);
		this._sizes.set(Particle.FINE_SMOKE, 20);

		this._counts = new Map<Particle, number>();
		this._counts.set(Particle.PELLET_SPARKS, 12);
		this._counts.set(Particle.LASER, 8);
		this._counts.set(Particle.LASER_SPARKS, 3);
		this._counts.set(Particle.CONFETTI, 18);
		this._counts.set(Particle.LINES, 7);
		this._counts.set(Particle.PORTAL, 16);
		this._counts.set(Particle.TEARS, 4);

		this._emitters = new Map<Particle, ObjectBuffer<THREE.Object3D>>();

		Object.keys(Particle).forEach((value) => {
			const num = Number(value);
			if (!isNaN(num) && num > 0) {
				if (this._sizes.has(num)) {
					this.createEmitter(num, this._sizes.get(num));
				} else {
					this.createEmitter(num);
				}
			}
		});
	}

	override postCamera() : boolean { return true; }

	emit(particle : Particle, ttl : number, update : (object : THREE.Object3D, ts : number) => void, overrides? : ObjectOverrides) : RenderCustom {
		let obj = this._emitters.get(particle).getObject(overrides);
		let custom = new RenderCustom(this.nextId());
		custom.setMesh(obj);
		custom.setUpdate(update);
		this.addCustomTemp(custom, ttl, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
		return custom;
	}

	emitObject(obj : THREE.Object3D, ttl : number, update : (object : THREE.Object3D, ts : number) => void) : RenderCustom {
		let custom = new RenderCustom(this.nextId());
		custom.setMesh(obj);
		custom.setUpdate(update);
		this.addCustomTemp(custom, ttl, (object : THREE.Object3D) => {});
		return custom;
	}

	delete(particle : Particle, custom : RenderCustom) {
		if (!Util.defined(custom)) {
			return;
		}

		this.deleteCustom(custom, (object : THREE.Object3D) => { this._emitters.get(particle).returnObject(object); });
	}

	private createEmitter(particle : Particle, size? : number) : void {
		this._emitters.set(particle, new ObjectBuffer<THREE.Object3D>(() => {
			if (this._counts.has(particle)) {
				return this.createInstancedMesh(particle, this._counts.get(particle));
			}
			return this.createMesh(particle);
		}, size));
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