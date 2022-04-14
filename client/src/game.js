import * as THREE from 'three';
import { RenderObject } from './render_object.js';
import { RenderExplosion } from './render_explosion.js';
import { RenderPlayer } from './render_player.js';
import { RenderProjectile } from './render_projectile.js';
import { SceneMap } from './scene_map.js';
import { Util } from './util.js';
import { connection } from './connection.js';
import { renderer } from './renderer.js';
import { ui } from './ui.js';
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
        connection.addHandler(gameStateType, (msg) => { this.updateGameState(msg); });
        connection.addHandler(gameUpdateType, (msg) => { console.log(msg); this.updateGameState(msg); });
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
    animate() {
        this.extrapolateState();
        this.sceneMap().updateComponents(renderer.cameraTarget());
        this.updateCamera();
        this.extrapolatePlayerDir();
        renderer.render();
        this._animateFrames++;
        requestAnimationFrame(() => { this.animate(); });
    }
    createKeyMsg() {
        const msg = ui.createKeyMsg(this._keyUpdates);
        if (this.sceneMap().has(playerSpace, this._id)) {
            const mouse = renderer.getMouseWorld();
            const player = this.sceneMap().get(playerSpace, this._id).pos();
            const dir = new THREE.Vector2(mouse.x - player.x, mouse.y - player.y);
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
        if (msg.T === gameStateType) {
            if (seqNum <= this._lastSeqNum) {
                return;
            }
            else {
                this._lastSeqNum = seqNum;
            }
        }
        if (Util.defined(msg.Os)) {
            for (const [stringSpace, objects] of Object.entries(msg.Os)) {
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
                        else if (space === rocketSpace) {
                            renderObj = new RenderProjectile(space, id);
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
    }
    extrapolateState() {
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
                if (!this.sceneMap().has(space, id))
                    continue;
                this.sceneMap().update(space, id, object);
            }
        }
    }
    extrapolatePlayerDir() {
        if (this.sceneMap().has(playerSpace, this._id)) {
            const mouse = renderer.getMouseWorld();
            const playerPos = this.sceneMap().get(playerSpace, this._id).pos();
            const dir = new THREE.Vector2(mouse.x - playerPos.x, mouse.y - playerPos.y);
            dir.normalize();
            const player = this.sceneMap().get(playerSpace, this._id);
            player.setDir(dir, dir.clone());
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
