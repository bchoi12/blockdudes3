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
        this._meMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this._otherMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this._objectMaterial = new THREE.MeshBasicMaterial({ color: 0x777777 });
        this._ui = ui;
        this._renderer = this._ui.renderer();
        this._connection = connection;
        this._id = -1;
        this._objects = new Map();
        this._lastPlayerUpdate = 0;
        this._animateFrames = 0;
        this.initHandlers();
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
        this.updateState();
        this.updateCamera();
        this._renderer.render();
        this._animateFrames++;
        requestAnimationFrame(() => { this.animate(); });
    }
    initHandlers() {
        this._connection.addHandler(initType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(joinType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(leftType, (msg) => { this.updatePlayers(msg); });
        this._connection.addHandler(playerStateType, (msg) => { this.updatePlayerState(msg); });
        this._connection.addHandler(objectInitType, (msg) => { this.initObjects(msg); });
    }
    updatePlayers(msg) {
        const addPlayer = (id) => {
            this._renderer.addObject(ObjectType.PLAYER, id, new THREE.Mesh(new THREE.BoxGeometry(), id == this._id ? this._meMaterial : this._otherMaterial));
            wasmAddPlayer(id);
        };
        const deletePlayer = (id) => {
            this._renderer.deleteObject(ObjectType.PLAYER, id);
            wasmDeletePlayer(id);
        };
        switch (msg.T) {
            case initType:
                this._id = msg.Id;
                for (const [stringId, client] of Object.keys(msg.Cs)) {
                    if (this._id == Number(stringId))
                        continue;
                    addPlayer(Number(stringId));
                }
                break;
            case joinType:
                addPlayer(msg.Id);
                break;
            case leftType:
                deletePlayer(msg.Id);
                break;
        }
    }
    updatePlayerState(msg) {
        if (this._lastPlayerUpdate > msg.TS)
            return;
        for (const [stringId, player] of Object.entries(msg.Ps)) {
            const id = Number(stringId);
            wasmSetPlayerData(id, player);
            this._renderer.updateObject(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
        }
        this._lastPlayerUpdate = msg.TS;
    }
    initObjects(msg) {
        this._renderer.clearObjects(ObjectType.OBJECT);
        this._objects.clear();
        for (const [stringId, object] of Object.entries(msg.Os)) {
            const id = Number(stringId);
            this._objects.set(id, object);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(), this._objectMaterial);
            this._renderer.addObject(ObjectType.OBJECT, id, mesh);
            this._renderer.updateObject(ObjectType.OBJECT, id, object.Pos.X, object.Pos.Y);
        }
    }
    updateCamera() {
        if (!this._renderer.hasObject(ObjectType.PLAYER, this._id))
            return;
        const playerRender = this._renderer.getObject(ObjectType.PLAYER, this._id);
        this._renderer.setCamera(playerRender.position.x, playerRender.position.y);
    }
    updateState() {
        const state = JSON.parse(wasmUpdateState());
        for (const [stringId, player] of Object.entries(state.Ps)) {
            const id = Number(stringId);
            if (!this._renderer.hasObject(ObjectType.PLAYER, id))
                continue;
            this._renderer.updateObject(ObjectType.PLAYER, id, player.Pos.X, player.Pos.Y);
        }
    }
}
