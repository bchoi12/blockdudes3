var InputMode;
(function (InputMode) {
    InputMode[InputMode["DEFAULT"] = 0] = "DEFAULT";
    InputMode[InputMode["GAME"] = 1] = "GAME";
    InputMode[InputMode["CHAT"] = 2] = "CHAT";
})(InputMode || (InputMode = {}));
class UI {
    constructor(div, connection) {
        this._chatKeyCode = 13;
        this._div = div;
        this._renderer = new Renderer(elm("renderer"));
        this._connection = connection;
        this.initHandlers();
        this._id = -1;
        this._mode = InputMode.DEFAULT;
        this._keys = new Set();
        this._keyMap = new Map();
        this._keyMap.set(38, upKey);
        this._keyMap.set(87, upKey);
        this._keyMap.set(40, downKey);
        this._keyMap.set(83, downKey);
        this._keyMap.set(37, leftKey);
        this._keyMap.set(65, leftKey);
        this._keyMap.set(39, rightKey);
        this._keyMap.set(68, rightKey);
    }
    addDiv(div) {
    }
    renderer() {
        return this._renderer;
    }
    displayGame() {
        elm("div-login").style.display = "none";
        this._div.style.display = "block";
        elm("messages").style.bottom = (elm("form-send-message").offsetHeight + 4) + "px";
        elm("message-box").style.width = elm("messages").offsetWidth + "px";
        this.changeInputMode(InputMode.GAME);
        this.initKeyListeners();
    }
    updateStats(ping, fps) {
        elm("stats").textContent = "Ping : " + ping + " | FPS: " + fps;
    }
    updateClients(msg) {
        const id = "" + msg.Id;
        switch (msg.T) {
            case initType:
                this._id = msg.Id;
                return;
            case joinType:
                this.system(msg.C.N + " #" + id + " just joined!");
                break;
            case leftType:
                this.system(msg.C.N + " #" + id + " left");
                break;
        }
        elm("people").innerHTML = "";
        for (let [id, client] of Object.entries(msg.Cs)) {
            const html = document.createElement("span");
            html.textContent = client.N + " #" + id;
            elm("people").appendChild(html);
            elm("people").appendChild(document.createElement("br"));
        }
        ;
    }
    changeInputMode(inputMode) {
        this._mode = inputMode;
        if (this._mode == InputMode.CHAT) {
            elm("messages").classList.remove("chat-hide");
            elm("messages").classList.remove("no-select");
            inputElm("form-send-message").style.display = "block";
            inputElm("message-box").focus();
        }
        else if (this._mode == InputMode.GAME) {
            elm("messages").classList.add("chat-hide");
            elm("messages").classList.add("no-select");
            inputElm("form-send-message").style.display = "none";
            inputElm("message-box").blur();
        }
    }
    requestFullScreen() {
        const canvas = this._renderer.elm();
        canvas.requestFullscreen();
    }
    pointerLock() {
        const canvas = this._renderer.elm();
        canvas.requestPointerLock();
    }
    pointerUnlock() { document.exitPointerLock(); }
    system(message) {
        this.chat({
            N: "",
            M: message,
        });
    }
    chat(msg) {
        const name = msg.N;
        const message = msg.M;
        if (!defined(name) || !defined(message))
            return;
        if (message.length == 0)
            return;
        if (name.length > 0) {
            const nameSpan = document.createElement("span");
            nameSpan.classList.add("message-name");
            nameSpan.textContent = name + ": ";
            elm("messages").appendChild(nameSpan);
        }
        const messageSpan = document.createElement("span");
        messageSpan.textContent = message;
        elm("messages").appendChild(messageSpan);
        elm("messages").appendChild(document.createElement("br"));
        elm("messages").scrollTop = elm("messages").scrollHeight;
    }
    initHandlers() {
        this._connection.addHandler(chatType, (msg) => { this.chat(msg); });
        this._connection.addHandler(initType, (msg) => { this.updateClients(msg); });
        this._connection.addHandler(joinType, (msg) => { this.updateClients(msg); });
        this._connection.addHandler(leftType, (msg) => { this.updateClients(msg); });
    }
    initKeyListeners() {
        const self = this;
        function recordKey(e) {
            if (e.repeat)
                return;
            if (e.keyCode == self._chatKeyCode) {
                self.handleChat();
                return;
            }
            if (self._mode != InputMode.GAME)
                return;
            if (!self._keyMap.has(e.keyCode))
                return;
            const key = self._keyMap.get(e.keyCode);
            if (!self._keys.has(key)) {
                self._keys.add(key);
                self.sendKeyMessage();
            }
        }
        function releaseKey(e) {
            if (self._mode != InputMode.GAME)
                return;
            if (!self._keyMap.has(e.keyCode))
                return;
            const key = self._keyMap.get(e.keyCode);
            if (self._keys.has(key)) {
                self._keys.delete(key);
                self.sendKeyMessage();
            }
        }
        document.addEventListener('keydown', recordKey);
        document.addEventListener('keyup', releaseKey);
    }
    handleChat() {
        if (this._mode == InputMode.GAME) {
            this.changeInputMode(InputMode.CHAT);
            if (this._keys.size > 0) {
                this._keys.clear();
                this.sendKeyMessage();
            }
            return;
        }
        if (inputElm("message-box").value.length == 0) {
            this.changeInputMode(InputMode.GAME);
            return;
        }
        if (!this._connection.canSend()) {
            this.system("Unable to send message, not connected to server!");
        }
        const message = {
            T: chatType,
            Chat: {
                M: inputElm("message-box").value.trim(),
            }
        };
        if (this._connection.send(message)) {
            inputElm("message-box").value = "";
            this.changeInputMode(InputMode.GAME);
        }
        else {
            this.system("Failed to send chat message!");
        }
    }
    sendKeyMessage() {
        this._connection.send({ T: keyType, Key: { K: Array.from(this._keys) } });
    }
}
