import * as THREE from 'three';

import { game } from './game.js'
import { GameOverlay } from './game_overlay.js'
import { LightBuffer, LightOverrides } from './light_buffer.js'
import { Lighting } from './lighting.js'
import { Particles } from './particles.js'
import { RenderBalconyBlock } from './render_balcony_block.js'
import { RenderBolt } from './render_bolt.js'
import { RenderEquip } from './render_equip.js'
import { RenderExplosion } from './render_explosion.js'
import { RenderGrapplingHook } from './render_grappling_hook.js'
import { RenderLight } from './render_light.js'
import { RenderMainBlock } from './render_main_block.js'
import { RenderObject } from './render_object.js'
import { RenderPellet } from './render_pellet.js'
import { RenderPickup } from './render_pickup.js'
import { RenderPlayer } from './render_player.js'
import { RenderPortal } from './render_portal.js'
import { RenderRocket } from './render_rocket.js'
import { RenderRoofBlock } from './render_roof_block.js'
import { RenderStar } from './render_star.js'
import { RenderWall } from './render_wall.js'
import { RenderWeapon } from './render_weapon.js'
import { SceneComponent, SceneComponentType } from './scene_component.js'
import { LogUtil, Util } from './util.js'
import { Weather } from './weather.js'

export class SceneMap {
	private _scene : THREE.Scene;
	private _lighting : Lighting;
	private _weather : Weather;
	private _renders : Map<number, Map<number, RenderObject>>;
	private _deleted : Map<number, Set<number>>;

	private _components : Map<SceneComponentType, SceneComponent>;
	private _lightBuffer : LightBuffer;

	constructor() {
		this.reset();
	}

	reset() : void {
		this._scene = new THREE.Scene();
		this._scene.fog = new THREE.Fog(0x4444bb, 100, 400);

		this._renders = new Map();
		this._deleted = new Map();
		this._components = new Map<SceneComponentType, SceneComponent>();
	}

	setup() : void {
		this._lightBuffer = new LightBuffer(this._scene);
		this._components.clear();
		this.addComponent(SceneComponentType.GAME_OVERLAY, new GameOverlay());
		this.addComponent(SceneComponentType.LIGHTING, new Lighting());
		this.addComponent(SceneComponentType.WEATHER, new Weather());
		this.addComponent(SceneComponentType.PARTICLES, new Particles());
	}

	scene() : THREE.Scene { return this._scene; }

	addComponent(type : SceneComponentType, component : SceneComponent) : void {
		this._components.set(type, component);
		this._scene.add(component.scene());
	}

	getComponent(type: SceneComponentType) : SceneComponent {
		if (!this._components.has(type)) {
			console.error("Requested nonexistent component: " + type);
		}
		return this._components.get(type);
	}

	getComponentAsAny(type : SceneComponentType) : any {
		return this.getComponent(type);
	}

	update() : void {
		this._components.forEach((component, type) => {
			if (!component.postCamera()) {
				component.update();
			}
		});

		this._renders.forEach((map, space) => {
			map.forEach((object, id) => {
				if (object.deleted()) {
					object.update();
					this.delete(space, id);
					return;
				}
				if (!object.ready()) {
					return;
				}
				if (!object.initialized()) {
					object.initialize();
				}
				object.update();
			});
		});
	}

	postCameraUpdate() : void {
		this._components.forEach((component, type) => {
			if (component.postCamera()) {
				component.update();
			}
		});
	}

	snapshotWasm() : void {
		this._renders.forEach((map, space) => {
			map.forEach((object, id) => {
				if (!object.ready() || !object.initialized() || object.deleted()) {
					return;
				}
				object.snapshotWasm();
			});
		});
	}

	getPointLight(overrides : LightOverrides) : THREE.PointLight { return this._lightBuffer.getPointLight(overrides); }
	returnPointLight(light : THREE.PointLight) : void { this._lightBuffer.returnPointLight(light); }

	getMap(space : number) : Map<number, RenderObject> {
		if (!this._renders.has(space)) {
			this._renders.set(space, new Map<number, RenderObject>());
		}
		return this._renders.get(space);
	}

	new(space : number, id : number) : RenderObject {
		let renderObj;
		if (space === playerSpace) {
			renderObj = new RenderPlayer(space, id);
		} else if (space === mainBlockSpace) {
			renderObj = new RenderMainBlock(space, id);
		} else if (space === balconyBlockSpace) {
			renderObj = new RenderBalconyBlock(space, id);
		} else if (space === roofBlockSpace) {
			renderObj = new RenderRoofBlock(space, id);
		} else if (space === wallSpace) {
			renderObj = new RenderWall(space, id);
		} else if (space === explosionSpace) {
			renderObj = new RenderExplosion(space, id);
		} else if (space === lightSpace) {
			renderObj = new RenderLight(space, id);
		} else if (space === equipSpace) {
			renderObj = new RenderEquip(space, id);
		} else if (space === weaponSpace) {
			renderObj = new RenderWeapon(space, id);
		} else if (space === pelletSpace) {
			renderObj = new RenderPellet(space, id);
		} else if (space === boltSpace) {
			renderObj = new RenderBolt(space, id);
		} else if (space === rocketSpace) {
			renderObj = new RenderRocket(space, id);
		} else if (space === starSpace) {
			renderObj = new RenderStar(space, id);
		} else if (space === grapplingHookSpace) {
			renderObj = new RenderGrapplingHook(space, id);
		} else if (space === pickupSpace) {
			renderObj = new RenderPickup(space, id);
		} else if (space === portalSpace || space === goalSpace) {
			renderObj = new RenderPortal(space, id);
		} else if (space === spawnSpace) {
			renderObj = new RenderObject(space, id);
		} else {
			console.error("Unable to construct object for type " + space);
			return null;
		}

		this.add(renderObj);
		return renderObj;
	}

	add(object : RenderObject) : void {
		const space = object.space();
		const id = object.id();

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

	deleted(space : number, id : number) : boolean {
		if (!this._deleted.has(space)) {
			return false;
		}
		return this._deleted.get(space).has(id);
	}

	get(space : number, id : number) : RenderObject {
		const map = this.getMap(space);
		return map.get(id);
	}

	getAsAny(space : number, id : number) : any {
		return this.get(space, id);
	}

	delete(space : number, id : number) : void {
		const map = this.getMap(space);
		if (map.has(id)) {
			map.get(id).delete();
			this.removeMesh(map.get(id).mesh());
			map.delete(id);

			if (!this._deleted.has(space)) {
				this._deleted.set(space, new Set());
			}
			this._deleted.get(space).add(id);
		}
	}

	deleteIf(predicate : (object : RenderObject) => boolean) : void {
		this._renders.forEach((spacedMap) => {
			spacedMap.forEach((object) => {
				console.log("check " + object.spacedId().toString());
				if (predicate(object)) {
					console.log("Delete");
					this.delete(object.space(), object.id());
				}
			})
		})
	}

	removeMesh(object : THREE.Object3D) : void {
		this._scene.remove(object);
	}

	clear(space : number) : void {
		const map = this.getMap(space);
		map.forEach((object, id) => {
			this.delete(space, id);
		});
		map.clear();
	}

	clearAll() : void {
		this._renders.forEach((render, space) => {
			this.clear(space);
		});
		this._deleted.forEach((deleted, space) => {
			this._deleted.delete(space);
		});
		this._components.forEach((component, type) => {
			component.reset();
		});
	}

	setData(space : number, id : number, msg : { [k: string]: any }, seqNum?: number) : void {
		const map = this.getMap(space);
		const object = map.get(id);

		if (!Util.defined(object)) {
			this.delete(space, id);
			return;
		}
		object.setData(msg, seqNum);
	}
}