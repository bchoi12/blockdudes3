import * as THREE from 'three';

import { Lighting } from './lighting.js'
import { RenderObject } from './render_object.js'
import { LogUtil, Util } from './util.js'

export class Scene {
	private _scene : any;
	private _lighting : Lighting;
	private _renders : Map<number, Map<number, RenderObject>>;

	constructor() {
		this.reset();
	}

	scene() : any { return this._scene; }

	reset() : void {
		this._scene = new THREE.Scene();
		this._lighting = new Lighting();
		this._scene.add(this._lighting.scene());

		this._renders = new Map();
	}

	add(space : number, id : number, object : any) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			LogUtil.d("Overwriting object space " + space + ", id " + id + "!");
		}
		map.set(id, object);
		this._scene.add(object.mesh());
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

	setPlayerPosition(position : any) {
		this._lighting.setTarget(position);
	}

	private getMap(space : number) : Map<number, any> {
		if (!this._renders.has(space)) {
			this._renders.set(space, new Map<number, any>());
		}
		return this._renders.get(space);
	}
}