import * as THREE from 'three';

import { RenderCustom } from './render_custom.js'

export enum SceneComponentType {
	UNKNOWN = 0,
	LIGHTING = 1,
	WEATHER = 2,
	PARTICLES = 3,
}

export abstract class SceneComponent {
	protected _scene : THREE.Scene;

	private _nextId : number;

	private _objects : Map<number, THREE.Object3D>;
	private _customObjects : Map<number, RenderCustom>;

	constructor() {
		this._scene = new THREE.Scene();

		this._nextId = 1;
		this._objects = new Map<number, THREE.Object3D>();
		this._customObjects = new Map<number, RenderCustom>();
	}

	addObject(object : THREE.Object3D) : void {
		this.addObjectTemp(object, -1);
	}

	addObjectTemp(object : THREE.Object3D, ttl : number) : void {
		const id = this.nextId();
		this._objects.set(id, object);
		this._scene.add(object);

		if (ttl > 0) {
			setTimeout(() => {
				this._objects.delete(id);
				this._scene.remove(object);
			}, ttl);
		}
	}

	addCustom(custom : RenderCustom) : void {
		this.addCustomTemp(custom, -1);
	}

	addCustomTemp(custom : RenderCustom, ttl : number) : void {
		const id = this.nextId();

		custom.onMeshLoad(() => {
			this._customObjects.set(id, custom);
			this._scene.add(custom.mesh());

			if (ttl > 0) {
				setTimeout(() => {
					this._customObjects.delete(id);
					this._scene.remove(custom.mesh());
				}, ttl);
			}
		});
	}

	scene() : THREE.Scene { return this._scene; }

	reset() : void {}

	update() : void {
		this._customObjects.forEach((custom, id) => {
			custom.update();
		});
	}

	private nextId() : number {
		this._nextId++;
		return this._nextId - 1;
	}
}