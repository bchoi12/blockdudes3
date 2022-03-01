import * as THREE from 'three';

import { RenderParticle } from './render_particle.js'
import { SceneComponent } from './scene_component.js'

class Particles extends SceneComponent {

	private _nextId : number;
	private _particles : Map<number, RenderParticle>;

	constructor() {
		super();

		this._nextId = 1;
		this._particles = new Map<number, RenderParticle>();
	}

	add(particle : RenderParticle, ttl : number) : void {
		const id = this.nextId();

		particle.onMeshLoad(() => {
			this._particles.set(id, particle);
			this._scene.add(particle.mesh());

			console.log("new particle " + id);

			setTimeout(() => {
				this._particles.delete(id);
				this._scene.remove(particle.mesh());

				console.log("particle gone " + id);
			}, ttl);
		});
	}

	override update(position : THREE.Vector3) : void {
		this._particles.forEach((particle, id) => {
			particle.updateParticle(position);
		});
	}

	private nextId() : number {
		this._nextId++;
		return this._nextId - 1;
	}
}

export const particles = new Particles();