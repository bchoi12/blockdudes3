import * as THREE from 'three';
import { connection } from './connection.js';
import { options } from './options.js';
import { RenderObject } from './render_object.js';
import { RenderExplosion } from './render_explosion.js';
import { RenderPickup } from './render_pickup.js';
import { RenderPlayer } from './render_player.js';
import { RenderBolt } from './render_bolt.js';
import { RenderProjectile } from './render_projectile.js';
import { renderer } from './renderer.js';
import { SceneMap } from './scene_map.js';
import { ui } from './ui.js';
import { Util } from './util.js';
class Game {
    constructor() {
        this._statsInterval = 500;
        this._objectMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, shadowSide: THREE.FrontSide });
        this._bombMaterial = new THREE.MeshStandardMaterial({ color: 0x4444bb, transparent: true, opacity: 0.5 });
        this._sceneMap = new SceneMap();
        this._keyUpdates = 0;
        this._lastSeqNum = 0;
        this._animateFrames = 0;
    }
    setup() {
        connection.addHandler(objectDataType, (msg) => { this.updateGameState(msg); });
        connection.addHandler(objectUpdateType, (msg) => { this.updateGameState(msg); });
        connection.addHandler(playerInitType, (msg) => { this.initPlayer(msg); });
        connection.addHandler(levelInitType, (msg) => { this.initLevel(msg); });
    }
    start() {
        connection.addSender(keyType, () => {
            if (!Util.defined(this._id))
                return;
            this._keyUpdates++;
            const msg = this.createKeyMsg();
            connection.sendData(msg);
        }, frameMillis);
        this.animate();
        const self = this;
        function updateStats() {
            const ping = connection.ping();
            const fps = self._animateFrames * 1000 / self._statsInterval;
            ui.updateStats(ping, fps);
            self._animateFrames = 0;
            setTimeout(updateStats, self._statsInterval);
        }
        updateStats();
    }
    sceneMap() {
        return this._sceneMap;
    }
    sceneComponent(type) {
        return this._sceneMap.getComponent(type);
    }
    animate() {
        this.extrapolateState();
        this.updateCamera();
        this.sceneMap().updateComponents();
        this.extrapolatePlayerDir();
        renderer.render();
        this._animateFrames++;
        requestAnimationFrame(() => { this.animate(); });
    }
    createKeyMsg() {
        const mouse = renderer.getMouseWorld();
        const msg = {
            T: keyType,
            Key: {
                S: this._keyUpdates,
                K: ui.getKeys(),
                M: {
                    X: mouse.x,
                    Y: mouse.y,
                },
                D: {
                    X: 1,
                    Y: 0,
                },
            },
        };
        if (this.sceneMap().has(playerSpace, this._id)) {
            const mouse = renderer.getMouseWorld();
            const player = this.sceneMap().get(playerSpace, this._id);
            const weaponPos = player.weaponPos();
            const dir = new THREE.Vector2(mouse.x - weaponPos.x, mouse.y - weaponPos.y);
            dir.normalize();
            msg.Key.D = {
                X: dir.x,
                Y: dir.y,
            };
        }
        return msg;
    }
    initPlayer(msg) {
        this._id = msg.Id;
        for (const [stringId, data] of Object.entries(msg.Ps)) {
            const id = Number(stringId);
            if (this.sceneMap().has(playerSpace, id) || this.sceneMap().deleted(playerSpace, id)) {
                return;
            }
            this.sceneMap().add(playerSpace, id, new RenderPlayer(playerSpace, id));
            this.sceneMap().update(playerSpace, id, data);
        }
    }
    updateGameState(msg) {
        const seqNum = msg.S;
        if (msg.T === objectDataType) {
            if (seqNum <= this._lastSeqNum) {
                return;
            }
            else {
                this._lastSeqNum = seqNum;
            }
        }
        if (Util.defined(msg.G)) {
            if (msg.G.hasOwnProperty(objectStatesProp)) {
                this.parseObjectPropMap(msg.G[objectStatesProp], seqNum);
            }
        }
        if (Util.defined(msg.Os)) {
            this.parseObjectPropMap(msg.Os, seqNum);
        }
    }
    parseObjectPropMap(objectPropMap, seqNum) {
        for (const [stringSpace, objects] of Object.entries(objectPropMap)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                if (this.sceneMap().deleted(space, id)) {
                    continue;
                }
                if (!this.sceneMap().has(space, id)) {
                    let renderObj;
                    if (space === playerSpace) {
                        renderObj = new RenderPlayer(space, id);
                    }
                    else if (space === explosionSpace) {
                        renderObj = new RenderExplosion(space, id);
                    }
                    else if (space === boltSpace) {
                        renderObj = new RenderBolt(space, id);
                    }
                    else if (space === rocketSpace) {
                        renderObj = new RenderProjectile(space, id);
                    }
                    else if (space === pickupSpace) {
                        renderObj = new RenderPickup(space, id);
                    }
                    else {
                        console.error("Unable to construct object for type " + space);
                        continue;
                    }
                    this.sceneMap().add(space, id, renderObj);
                }
                this.sceneMap().update(space, id, object, seqNum);
            }
        }
    }
    extrapolateState() {
        if (!options.clientPrediction) {
            return;
        }
        if (this.sceneMap().has(playerSpace, this._id)) {
            const keyMsg = this.createKeyMsg();
            keyMsg.Key.K = Util.arrayToString(keyMsg.Key.K);
            wasmUpdateKeys(this._id, keyMsg.Key);
        }
        const state = JSON.parse(wasmUpdateState());
        for (const [stringSpace, objects] of Object.entries(state.Os)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                if (!this.sceneMap().has(space, id)) {
                    console.error("Extrapolated nonexistent object: " + space + " " + id);
                    continue;
                }
                this.sceneMap().update(space, id, object);
            }
        }
    }
    extrapolatePlayerDir() {
        if (this.sceneMap().has(playerSpace, this._id)) {
            const mouse = renderer.getMouseWorld();
            const player = this.sceneMap().get(playerSpace, this._id);
            const playerPos = player.pos();
            const dir = new THREE.Vector2(mouse.x - playerPos.x, mouse.y - playerPos.y);
            dir.normalize();
            const weaponPos = player.weaponPos();
            const weaponDir = new THREE.Vector2(mouse.x - weaponPos.x, mouse.y - weaponPos.y);
            weaponDir.normalize();
            player.setDir(dir);
            player.setWeaponDir(weaponDir);
        }
    }
    initLevel(msg) {
        this.sceneMap().clearObjects();
        const level = JSON.parse(wasmLoadLevel(msg.L));
        for (const [stringSpace, objects] of Object.entries(level.Os)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(object[dimProp].X, object[dimProp].Y, 5.0), this._objectMaterial);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                const renderObj = new RenderObject(space, id);
                renderObj.setMesh(mesh);
                this.sceneMap().add(space, id, renderObj);
                this.sceneMap().update(space, id, object);
            }
        }
    }
    updateCamera() {
        if (!Util.defined(this._id))
            return;
        if (!this.sceneMap().has(playerSpace, this._id))
            return;
        const playerPos = this.sceneMap().get(playerSpace, this._id).pos();
        renderer.setCameraTarget(new THREE.Vector3(playerPos.x, playerPos.y, 0));
    }
}
export const game = new Game();
