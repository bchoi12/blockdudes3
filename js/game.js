var GameState;
(function (GameState) {
    GameState[GameState["UNKNOWN"] = 0] = "UNKNOWN";
})(GameState || (GameState = {}));
class Game {
    constructor(ui, connection) {
        this._statsInterval = 500;
        this._extendCameraXThreshold = 0.8;
        this._extendCameraYThreshold = 0.8;
        this._extendCameraX = 0.0;
        this._extendCameraY = 0.0;
        this._meMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this._otherMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this._objectMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        this._bombMaterial = new THREE.MeshStandardMaterial({ color: 0x7777ff, wireframe: true });
        this._meMaterial.shadowSide = THREE.FrontSide;
        this._otherMaterial.shadowSide = THREE.FrontSide;
        this._objectMaterial.shadowSide = THREE.FrontSide;
        this._ui = ui;
        this._renderer = this._ui.renderer();
        this._loader = new Loader();
        this._connection = connection;
        this._keyUpdates = 0;
        this._lastGameUpdate = 0;
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
            const msg = this._ui.createKeyMsg();
            this._keyUpdates++;
            msg.Key.S = this._keyUpdates;
            this._connection.sendData(msg);
        }, frameMillis);
    }
    addPlayer(initData) {
        const id = initData.Id;
        if (wasmHas(playerSpace, id))
            return;
        this._loader.load(Model.CHICKEN, (mesh) => {
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
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(object[dimProp].X / 2, 6, 4), this._bombMaterial);
                    mesh.rotation.x = Math.random() * Math.PI;
                    mesh.rotation.y = Math.random() * Math.PI;
                    mesh.rotation.z = Math.random() * Math.PI;
                    mesh.receiveShadow = true;
                    const renderObj = new RenderObject(mesh);
                    this._currentObjects.add(sid(space, id));
                    this._renderer.scene().add(space, id, renderObj);
                }
                deleteObjects.delete(sid(space, id));
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
            wasmSetData(playerSpace, id, player);
            this._renderer.scene().update(playerSpace, id, player);
        }
        if (msg.Ss.length > 0) {
            this._renderer.scene().renderShots(msg.Ss);
        }
        this._lastGameUpdate = msg.S;
    }
    extrapolateState() {
        const msg = this._ui.createKeyMsg();
        const data = new Map();
        data[keysProp] = arrayToString(msg.Key.K);
        data[dirProp] = msg.Key.M;
        wasmSetData(playerSpace, this._id, data);
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
            this._renderer.scene().update(playerSpace, id, player);
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
