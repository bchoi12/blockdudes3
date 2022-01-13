var GameState;
(function (GameState) {
    GameState[GameState["UNKNOWN"] = 0] = "UNKNOWN";
})(GameState || (GameState = {}));
class Game {
    constructor(ui, connection) {
        this._statsInterval = 500;
        this._objectMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        this._bombMaterial = new THREE.MeshStandardMaterial({ color: 0x4444bb });
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
            if (!defined(this._id))
                return;
            this._keyUpdates++;
            const msg = this._ui.createKeyMsg(this._keyUpdates);
            this._connection.sendData(msg);
        }, frameMillis);
    }
    addPlayer(initData) {
        const id = initData.Id;
        if (wasmHas(playerSpace, id))
            return;
        this._loader.load(Model.CHICKEN, (mesh) => {
            const profileBox = new THREE.Box3().setFromObject(mesh.getObjectByName("profileMesh"));
            let size = new THREE.Vector3();
            profileBox.getSize(size);
            const playerMesh = mesh.getObjectByName("mesh");
            const scaleX = initData.Dim.X / size.z;
            const scaleY = initData.Dim.Y / size.y;
            const scaleZ = 0.6 / size.x;
            playerMesh.scale.set(scaleZ, scaleY, scaleX);
            let meshBox = new THREE.Box3().setFromObject(playerMesh);
            playerMesh.position.y -= meshBox.min.y;
            playerMesh.position.y -= initData.Dim.Y / 2;
            const player = new RenderPlayer(mesh);
            player.mesh().position.x = initData.Pos.X;
            player.mesh().position.y = initData.Pos.Y;
            this._renderer.scene().add(playerSpace, id, player);
            wasmAdd(playerSpace, id, initData);
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
                msg.Ps.forEach((initData) => {
                    this.addPlayer(initData);
                });
                break;
            case playerJoinType:
                msg.Ps.forEach((initData) => {
                    this.addPlayer(initData);
                });
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
                    wasmAdd(space, id, { Pos: object[posProp], Dim: object[dimProp] });
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 12, 8), this._bombMaterial);
                    mesh.rotation.x = Math.random() * Math.PI;
                    mesh.rotation.y = Math.random() * Math.PI;
                    mesh.rotation.z = Math.random() * Math.PI;
                    mesh.receiveShadow = true;
                    const renderObj = new RenderObject(mesh);
                    this._currentObjects.add(sid(space, id));
                    this._renderer.scene().add(space, id, renderObj);
                }
                deleteObjects.delete(sid(space, id));
                this.sanitizeData(object);
                wasmSetData(space, id, object);
                this._renderer.scene().update(space, id, object);
            }
        }
        deleteObjects.forEach((sid) => {
            this._currentObjects.delete(sid);
            this._renderer.scene().delete(space(sid), id(sid));
            wasmDelete(space(sid), id(sid));
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
        if (defined(this._id)) {
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
            if (id != this._id || !defined(this._currentPlayerData)) {
                this._renderer.scene().update(playerSpace, id, player);
            }
            else {
                this._renderer.scene().update(playerSpace, id, this.interpolateState(this._currentPlayerData, player));
            }
        }
    }
    interpolateState(currentData, nextData) {
        const millisElapsed = Date.now() - this._lastGameUpdateTime;
        const weight = Math.min(millisElapsed / (frameMillis * 3), 1);
        const data = nextData;
        data[posProp] = this.interpolateVec2(currentData[posProp], nextData[posProp], weight);
        data[velProp] = this.interpolateVec2(currentData[velProp], nextData[velProp], weight);
        data[accProp] = this.interpolateVec2(currentData[accProp], nextData[accProp], weight);
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
                data[keysProp] = arrayToString(keys);
            }
        }
    }
    initLevel(msg) {
        this._currentObjects.clear();
        this._renderer.scene().clearObjects();
        const objects = JSON.parse(wasmLoadLevel(msg.L));
        objects.Os.forEach((initData) => {
            const id = initData.Id;
            const space = initData.S;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(initData.Dim.X, initData.Dim.Y, 1.0), this._objectMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const renderObj = new RenderObject(mesh);
            mesh.position.x = initData.Pos.X;
            mesh.position.y = initData.Pos.Y;
            this._renderer.scene().add(space, id, renderObj);
        });
    }
    updateCamera() {
        if (!defined(this._id))
            return;
        if (!this._renderer.scene().has(playerSpace, this._id))
            return;
        const playerRender = this._renderer.scene().get(playerSpace, this._id);
        const adj = new THREE.Vector3();
        this._renderer.setCamera(playerRender.mesh().position, adj);
    }
}
