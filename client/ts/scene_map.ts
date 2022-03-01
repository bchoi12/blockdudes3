import * as THREE from 'three';

import { Lighting } from './lighting.js'
import { particles } from './particles.js'
import { RenderMesh } from './render_mesh.js'
import { RenderObject } from './render_object.js'
import { SceneComponent } from './scene_component.js'
import { GameUtil, LogUtil, Util } from './util.js'
import { Weather } from './weather.js'

export class SceneMap {
	private _scene : THREE.Scene;
	private _lighting : Lighting;
	private _weather : Weather;
	private _renders : Map<number, Map<number, RenderObject>>;

	private _components : Array<SceneComponent>;

	constructor() {
		this.reset();
	}

	scene() : THREE.Scene { return this._scene; }

	reset() : void {
		this._scene = new THREE.Scene();
		this._renders = new Map();

		this._components = new Array<SceneComponent>();
		this.addComponent(new Lighting());
		this.addComponent(new Weather());
		this.addComponent(particles);
	}

	addComponent(component : SceneComponent) {
		this._components.push(component);
		this._scene.add(component.scene());
	}

	updateComponents(position : THREE.Vector3) : void {
		this._components.forEach((component) => {
			component.update(position);
		});
	}

	// Add untracked mesh to the scene.
	addMesh(mesh : RenderMesh) : void {
		mesh.onMeshLoad(() => {
			this._scene.add(mesh.mesh());
		});
	}

	// Remove untracked mesh from the scene.
	removeMesh(mesh : RenderMesh) : void {
		this._scene.remove(mesh.mesh());
	}

	add(space : number, id : number, object : RenderObject) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			LogUtil.d("Overwriting object space " + space + ", id " + id + "!");
		}
		map.set(id, object);
		object.onMeshLoad(() => {
			if (this.has(space, id)) {
				this._scene.add(object.mesh());
			}
		});
	}

	has(space : number, id : number) : boolean {
		const map = this.getMap(space);
		return map.has(id) && Util.defined(map.get(id));	
	}

	get(space : number, id : number) : any {
		const map = this.getMap(space);
		return map.get(id);
	}

	delete(space : number, id : number) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			this._scene.remove(map.get(id).mesh());
			map.delete(id);
		}
	}

	clear(space : number) : void {
		const map = this.getMap(space);
		map.forEach((id, object) => {
			this.delete(space, id);
		});
		map.clear();
	}

	clearObjects() : void {
		this._renders.forEach((render, space) => {
			if (space != playerSpace) {
				this.clear(space);
			}
		});
	}

	update(space : number, id : number, msg : any) : void {
		const map = this.getMap(space);
		const object = map.get(id);

		if (!Util.defined(object)) {
			this.delete(space, id);
			return;
		}

		object.update(msg);
	}

	renderShots(shots : Array<any>) : void {
		shots.forEach((shot) => {
			const sid = shot[spacedIdProp];
			const owner = this.get(sid.S, sid.Id);
			owner.shoot(shot);
		})
	}

	private getMap(space : number) : Map<number, any> {
		if (!this._renders.has(space)) {
			this._renders.set(space, new Map<number, any>());
		}
		return this._renders.get(space);
	}
}