import * as THREE from 'three';
import { Model, Loader } from './loader.js';
import { RenderObject } from './render_object.js';
import { RenderPlayer } from './render_player.js';
import { RenderWeapon } from './render_weapon.js';
import { GameUtil, Util } from './util.js';
class Game {
    constructor(ui, connection) {
        this._statsInterval = 500;
        this._objectMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        this._bombMaterial = new THREE.MeshStandardMaterial({ color: 0x4444bb, transparent: true, opacity: 0.5 });
        this._objectMaterial.shadowSide = THREE.FrontSide;
        this._ui = ui;
        this._renderer = this._ui.renderer();
        this._loader = new Loader();
        this._connection = connection;
        this._keyUpdates = 0;
        this._lastGameUpdate = 0;
        this._lastGameUpdateTime = Date.now();
        this._animateFrames = 0;
        this._currentObjects = new Set();
        this.initServerTalk();
    }
    start() {
        this._ui.displayGame();
        this.animate();
        const self = this;
        function updateStats() {
            const ping = self._connection.ping();
            const fps = self._animateFrames * 1000 / self._statsInterval;
            self._ui.updateStats(ping, fps);
            self._animateFrames = 0;
            setTimeout(updateStats, self._statsInterval);
        }
        updateStats();
    }
    animate() {
        this.extrapolateState();
        this.updateCamera();
        this._renderer.render();
        requestAnimationFrame(() => { this.animate(); });
        this._animateFrames++;
    }
    initServerTalk() {
        this._connection.addHandler(gameStateType, (msg) => { this.updateGameState(msg); });
        this._connection.addHandler(playerInitType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(playerJoinType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(leftType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(levelInitType, (msg) => { this.initLevel(msg); });
        this._connection.addSender(keyType, () => {
            if (!Util.defined(this._id))
                return;
            this._keyUpdates++;
            const msg = this._ui.createKeyMsg(this._keyUpdates);
            this._connection.sendData(msg);
        }, frameMillis);
    }
    addPlayer(id, data) {
        if (wasmHas(playerSpace, id))
            return;
        this._loader.load(Model.CHICKEN, (mesh) => {
            const playerMesh = mesh.getObjectByName("mesh");
            playerMesh.position.y -= data[dimProp].Y / 2;
            const player = new RenderPlayer(mesh);
            const pos = data[posProp];
            player.mesh().position.x = pos.X;
            player.mesh().position.y = pos.Y;
            this._renderer.scene().add(playerSpace, id, player);
            wasmAdd(playerSpace, id, data);
            this._loader.load(Model.UZI, (weaponMesh) => {
                player.setWeapon(new RenderWeapon(weaponMesh));
            });
        });
    }
    deletePlayer(id) {
        this._renderer.scene().delete(playerSpace, id);
        wasmDelete(playerSpace, id);
    }
    updatePlayers(msg) {
        switch (msg.T) {
            case playerInitType:
                this._id = msg.Id;
                for (const [stringId, player] of Object.entries(msg.Ps)) {
                    const id = Number(stringId);
                    this.addPlayer(id, player);
                }
                break;
            case playerJoinType:
                for (const [stringId, player] of Object.entries(msg.Ps)) {
                    const id = Number(stringId);
                    this.addPlayer(id, player);
                }
                break;
            case leftType:
                this.deletePlayer(msg.Client.Id);
                break;
        }
    }
    updateGameState(msg) {
        if (this._lastGameUpdate >= msg.S)
            return;
        const deleteObjects = new Set(this._currentObjects);
        for (const [stringSpace, objects] of Object.entries(msg.Os)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                if (!wasmHas(space, id)) {
                    wasmAdd(space, id, object);
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._bombMaterial);
                    mesh.rotation.x = Math.random() * Math.PI;
                    mesh.rotation.y = Math.random() * Math.PI;
                    mesh.rotation.z = Math.random() * Math.PI;
                    mesh.receiveShadow = true;
                    const renderObj = new RenderObject(mesh);
                    this._currentObjects.add(GameUtil.sid(space, id));
                    this._renderer.scene().add(space, id, renderObj);
                }
                deleteObjects.delete(GameUtil.sid(space, id));
                this.sanitizeData(object);
                wasmSetData(space, id, object);
                this._renderer.scene().update(space, id, object);
            }
        }
        deleteObjects.forEach((sid) => {
            this._currentObjects.delete(sid);
            this._renderer.scene().delete(GameUtil.space(sid), GameUtil.id(sid));
            wasmDelete(GameUtil.space(sid), GameUtil.id(sid));
        });
        for (const [stringId, player] of Object.entries(msg.Ps)) {
            const id = Number(stringId);
            if (!wasmHas(playerSpace, id))
                continue;
            if (id === this._id) {
                this._currentPlayerData = player;
            }
            this.sanitizePlayerData(player);
            wasmSetData(playerSpace, id, player);
            this._renderer.scene().update(playerSpace, id, player);
        }
        if (msg.Ss.length > 0) {
            this._renderer.scene().renderShots(msg.Ss);
        }
        this._lastGameUpdate = msg.S;
        this._lastGameUpdateTime = Date.now();
    }
    extrapolateState() {
        if (Util.defined(this._id)) {
            const keyMsg = this._ui.createWasmKeyMsg(this._keyUpdates);
            wasmUpdateKeys(this._id, keyMsg);
        }
        const state = JSON.parse(wasmUpdateState());
        for (const [stringSpace, objects] of Object.entries(state.Os)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                if (!this._renderer.scene().has(space, id))
                    continue;
                this._renderer.scene().update(space, id, object);
            }
        }
        for (const [stringId, player] of Object.entries(state.Ps)) {
            const id = Number(stringId);
            if (!this._renderer.scene().has(playerSpace, id))
                continue;
            if (id != this._id || !Util.defined(this._currentPlayerData)) {
                this._renderer.scene().update(playerSpace, id, player);
            }
            else {
                this._renderer.scene().update(playerSpace, id, this.interpolateState(this._currentPlayerData, player));
            }
        }
    }
    interpolateState(currentData, nextData) {
        const millisElapsed = Date.now() - this._lastGameUpdateTime;
        const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;
        const data = nextData;
        data[posProp] = this.interpolateVec2(currentData[posProp], nextData[posProp], weight);
        if (currentData.hasOwnProperty(velProp) && nextData.hasOwnProperty(velProp)) {
            data[velProp] = this.interpolateVec2(currentData[velProp], nextData[velProp], weight);
        }
        if (currentData.hasOwnProperty(accProp) && nextData.hasOwnProperty(accProp)) {
            data[accProp] = this.interpolateVec2(currentData[accProp], nextData[accProp], weight);
        }
        return data;
    }
    interpolateVec2(current, next, weight) {
        const vec = current;
        vec.X = current.X * (1 - weight) + next.X * weight;
        vec.Y = current.Y * (1 - weight) + next.Y * weight;
        return vec;
    }
    sanitizeData(data) {
        return;
    }
    sanitizePlayerData(data) {
        this.sanitizeData(data);
        if (data.hasOwnProperty(keysProp)) {
            const keys = Object.keys(data[keysProp]);
            if (keys.length > 0) {
                data[keysProp] = Util.arrayToString(keys);
            }
        }
    }
    initLevel(msg) {
        this._currentObjects.clear();
        this._renderer.scene().clearObjects();
        const level = JSON.parse(wasmLoadLevel(msg.L));
        for (const [stringSpace, objects] of Object.entries(level.Os)) {
            for (const [stringId, object] of Object.entries(objects)) {
                const space = Number(stringSpace);
                const id = Number(stringId);
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(object[dimProp].X, object[dimProp].Y, 5.0), this._objectMaterial);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                const renderObj = new RenderObject(mesh);
                mesh.position.x = object[posProp].X;
                mesh.position.y = object[posProp].Y;
                this._renderer.scene().add(space, id, renderObj);
            }
        }
    }
    updateCamera() {
        if (!Util.defined(this._id))
            return;
        if (!this._renderer.scene().has(playerSpace, this._id))
            return;
        const playerRender = this._renderer.scene().get(playerSpace, this._id);
        const adj = new THREE.Vector3();
        this._renderer.setCamera(playerRender.mesh().position, adj);
    }
}
export { Game };
