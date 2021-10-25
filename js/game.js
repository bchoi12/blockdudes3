var GameState;
(function (GameState) {
    GameState[GameState["UNKNOWN"] = 0] = "UNKNOWN";
})(GameState || (GameState = {}));
var ObjectType;
(function (ObjectType) {
    ObjectType[ObjectType["UNKNOWN"] = 0] = "UNKNOWN";
    ObjectType[ObjectType["PLAYER"] = 1] = "PLAYER";
    ObjectType[ObjectType["OBJECT"] = 2] = "OBJECT";
})(ObjectType || (ObjectType = {}));
class Game {
    constructor(ui, connection) {
        this._statsInterval = 500;
        this._extendCameraXThreshold = 0.8;
        this._extendCameraYThreshold = 0.8;
        this._extendCameraX = 0.0;
        this._extendCameraY = 0.0;
        this._meMaterial = new THREE.MeshToonMaterial({ color: 0xff0000 });
        this._otherMaterial = new THREE.MeshToonMaterial({ color: 0x00ff00 });
        this._objectMaterial = new THREE.MeshToonMaterial({ color: 0x777777 });
        this._ui = ui;
        this._renderer = this._ui.renderer();
        this._connection = connection;
        this._keyUpdates = 0;
        this._lastGameUpdate = 0;
        this._animateFrames = 0;
        this.initServerTalk();
    }
    start() {
        this._ui.displayGame();
        this._id = this._connection.id();
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
        this._animateFrames++;
        requestAnimationFrame(() => { this.animate(); });
    }
    initServerTalk() {
        this._connection.addHandler(initType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(leftType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(gameStateType, (msg) => { this.updateGameState(msg); });
        this._connection.addHandler(playerInitType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(levelInitType, (msg) => { this.initLevel(msg); });
        this._connection.addSender(keyType, () => {
            const msg = this._ui.createKeyMsg();
            this._keyUpdates++;
            msg.Key.S = this._keyUpdates;
            this._connection.sendData(msg);
        }, frameMillis);
    }
    updatePlayers(msg) {
        const addPlayer = (id, initData) => {
            if (wasmHasPlayer(id))
                return;
            const material = id == this._id ? this._meMaterial : this._otherMaterial;
            const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(initData.Dim.X, initData.Dim.Y, 0.3), material);
            playerMesh.castShadow = true;
            playerMesh.receiveShadow = true;
            const outerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
            outerHand.position.z = 0.4;
            outerHand.castShadow = true;
            outerHand.receiveShadow = true;
            playerMesh.add(outerHand);
            const innerHand = new THREE.Mesh(new THREE.SphereGeometry(0.1), material);
            innerHand.position.z = 0.4;
            innerHand.castShadow = true;
            innerHand.receiveShadow = true;
            playerMesh.add(innerHand);
            this._renderer.addObject(ObjectType.PLAYER, id, playerMesh);
            wasmAddPlayer(id, initData);
        };
        const deletePlayer = (id) => {
            this._renderer.deleteObject(ObjectType.PLAYER, id);
            wasmDeletePlayer(id);
        };
        switch (msg.T) {
            case initType:
                this._id = msg.Id;
                break;
            case playerInitType:
                for (const [stringId, initData] of Object.entries(msg.Ps)) {
                    addPlayer(Number(stringId), initData);
                }
                break;
            case leftType:
                deletePlayer(msg.Id);
                break;
        }
    }
    updateGameState(msg) {
        if (this._lastGameUpdate >= msg.S)
            return;
        for (const [stringId, object] of Object.entries(msg.Os)) {
            const id = Number(stringId);
            wasmSetObjectData(id, object);
            this._renderer.updatePosition(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
        }
        for (const [stringId, player] of Object.entries(msg.Ps)) {
            const id = Number(stringId);
            wasmSetPlayerData(id, player);
            this._renderer.updatePlayer(id, player);
        }
        if (msg.Ss.length > 0) {
            this._renderer.renderShots(msg.Ss);
        }
        this._lastGameUpdate = msg.S;
    }
    extrapolateState() {
        const state = JSON.parse(wasmUpdateState());
        for (const [stringId, object] of Object.entries(state.Os)) {
            const id = Number(stringId);
            this._renderer.updatePosition(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
        }
        for (const [stringId, player] of Object.entries(state.Ps)) {
            const id = Number(stringId);
            if (!this._renderer.hasObject(ObjectType.PLAYER, id))
                continue;
            this._renderer.updatePosition(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
        }
    }
    initLevel(msg) {
        this._renderer.clearObjects(ObjectType.OBJECT);
        const objects = JSON.parse(wasmLoadLevel(msg.L));
        for (const [stringId, object] of Object.entries(objects.Os)) {
            const id = Number(stringId);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(object.Dim.X, object.Dim.Y, 1.0), this._objectMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this._renderer.addObject(ObjectType.OBJECT, id, mesh);
            this._renderer.updatePosition(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
        }
    }
    updateCamera() {
        if (!this._renderer.hasObject(ObjectType.PLAYER, this._id))
            return;
        const playerRender = this._renderer.getObject(ObjectType.PLAYER, this._id);
        const mouse = this._renderer.getMouseScreen();
        const adj = new THREE.Vector3();
        if (Math.abs(mouse.x) > this._extendCameraXThreshold) {
            adj.x = Math.sign(mouse.x) * (Math.abs(mouse.x) - this._extendCameraXThreshold) / (1 - this._extendCameraXThreshold) * this._extendCameraX;
        }
        if (Math.abs(mouse.y) > this._extendCameraYThreshold) {
            adj.y = Math.sign(mouse.y) * (Math.abs(mouse.y) - this._extendCameraYThreshold) / (1 - this._extendCameraYThreshold) * this._extendCameraY;
        }
        this._renderer.setCamera(playerRender.position, adj);
    }
}
