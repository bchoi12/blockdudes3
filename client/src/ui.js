import * as THREE from 'three';
import { HtmlUtil, Util } from './util.js';
import { Renderer } from './renderer.js';
import { Voice } from './voice.js';
var InputMode;
(function (InputMode) {
    InputMode[InputMode["UNKNOWN"] = 0] = "UNKNOWN";
    InputMode[InputMode["PAUSE"] = 1] = "PAUSE";
    InputMode[InputMode["GAME"] = 2] = "GAME";
    InputMode[InputMode["CHAT"] = 3] = "CHAT";
})(InputMode || (InputMode = {}));
var g_keys = new Set();
var g_mouse = new THREE.Vector3();
export class UI {
    constructor(div, connection) {
        this._chatKeyCode = 13;
        this._cursorWidth = 20;
        this._cursorHeight = 20;
        this._div = div;
        this._renderer = new Renderer(HtmlUtil.elm("renderer"));
        this._connection = connection;
        this._connection.addHandler(chatType, (msg) => { this.chat(msg); });
        this._connection.addHandler(joinType, (msg) => { this.updateClients(msg); });
        this._connection.addHandler(leftType, (msg) => { this.updateClients(msg); });
        this._connection.addHandler(joinVoiceType, (msg) => { this.updateClients(msg); });
        this._connection.addHandler(leftVoiceType, (msg) => { this.updateClients(msg); });
        this._mode = InputMode.PAUSE;
        this._keyMap = new Map();
        this._keyMap.set(38, upKey);
        this._keyMap.set(87, upKey);
        this._keyMap.set(40, downKey);
        this._keyMap.set(83, downKey);
        this._keyMap.set(37, leftKey);
        this._keyMap.set(65, leftKey);
        this._keyMap.set(39, rightKey);
        this._keyMap.set(68, rightKey);
        this._keyMap.set(32, dashKey);
        this._clients = new Map();
        this._voice = new Voice(connection);
        HtmlUtil.elm("voice").onclick = (e) => {
            e.stopPropagation();
            this.toggleVoice();
        };
    }
    addDiv(div) {
    }
    toggleVoice() {
        this._voice.toggleVoice();
    }
    createKeyMsg(seqNum) {
        const msg = {
            T: keyType,
            Key: {
                K: Array.from(g_keys),
                M: {},
                S: seqNum,
            },
        };
        const mouse = this._renderer.getMouseWorld();
        if (Util.defined(mouse)) {
            msg.Key.M = {
                X: mouse.x,
                Y: mouse.y,
            };
        }
        return msg;
    }
    createWasmKeyMsg(seqNum) {
        let msg = this.createKeyMsg(seqNum);
        msg.Key.K = Util.arrayToString(msg.Key.K);
        return msg.Key;
    }
    renderer() { return this._renderer; }
    displayGame() {
        HtmlUtil.elm("div-login").style.display = "none";
        this._div.style.display = "block";
        HtmlUtil.elm("message-box").style.width = HtmlUtil.elm("messages").offsetWidth + "px";
        window.addEventListener("blur", () => {
            this.changeInputMode(InputMode.PAUSE);
        });
        this.initMouseListener();
        this.initKeyListeners();
    }
    updateStats(ping, fps) {
        HtmlUtil.elm("stats").textContent = "Ping : " + ping + " | FPS: " + fps;
    }
    changeInputMode(inputMode) {
        this._mode = inputMode;
        if (this._mode == InputMode.PAUSE) {
            HtmlUtil.elm("overlay").style.display = "block";
            this.pointerUnlock();
        }
        else {
            HtmlUtil.elm("overlay").style.display = "none";
        }
        if (this._mode == InputMode.CHAT) {
            HtmlUtil.elm("messages").classList.remove("chat-hide");
            HtmlUtil.elm("messages").classList.remove("no-select");
            HtmlUtil.elm("messages").style.bottom = "2em";
            HtmlUtil.inputElm("form-send-message").style.display = "block";
            HtmlUtil.inputElm("message-box").focus();
            this.pointerUnlock();
        }
        if (this._mode == InputMode.GAME) {
            HtmlUtil.elm("messages").classList.add("chat-hide");
            HtmlUtil.elm("messages").classList.add("no-select");
            HtmlUtil.elm("messages").style.bottom = "1em";
            HtmlUtil.inputElm("form-send-message").style.display = "none";
            HtmlUtil.inputElm("message-box").blur();
            this.pointerLock();
        }
        else {
            if (g_keys.size > 0) {
                g_keys.clear();
            }
        }
    }
    clientName(client) {
        return client.Name + " #" + client.Id;
    }
    updateClients(msg) {
        switch (msg.T) {
            case joinType:
                this.print(this.clientName(msg.Client) + " just joined!");
                break;
            case leftType:
                this.print(this.clientName(msg.Client) + " left");
                break;
            case joinVoiceType:
                this.print(this.clientName(msg.Client) + " joined voice chat!");
                break;
            case leftVoiceType:
                this.print(this.clientName(msg.Client) + " left voice chat");
        }
        const addClient = (client) => {
            const id = client.Id;
            const html = document.createElement("span");
            html.id = "client-" + id;
            html.textContent = this.clientName(client);
            html.appendChild(document.createElement("br"));
            HtmlUtil.elm("clients").appendChild(html);
            this._clients.set(id, html);
        };
        const removeClient = (id) => {
            HtmlUtil.elm("clients").removeChild(this._clients.get(id));
            this._clients.delete(id);
        };
        if (this._clients.size == 0) {
            for (let [stringId, client] of Object.entries(msg.Clients)) {
                addClient(client);
            }
        }
        else if (msg.T == joinType) {
            addClient(msg.Client);
        }
        else if (msg.T == leftType) {
            removeClient(msg.Client.Id);
        }
    }
    print(message) {
        const messageSpan = document.createElement("span");
        messageSpan.textContent = message;
        HtmlUtil.elm("messages").appendChild(messageSpan);
        HtmlUtil.elm("messages").appendChild(document.createElement("br"));
        HtmlUtil.elm("messages").scrollTop = HtmlUtil.elm("messages").scrollHeight;
    }
    chat(msg) {
        const name = this.clientName(msg.Client);
        const message = msg.Message;
        if (!Util.defined(name) || !Util.defined(message))
            return;
        if (name.length == 0 || message.length == 0)
            return;
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("message-name");
        nameSpan.textContent = name + ": ";
        HtmlUtil.elm("messages").appendChild(nameSpan);
        this.print(message);
    }
    pointerLock() {
        this._renderer.elm().requestPointerLock();
    }
    pointerUnlock() {
        document.exitPointerLock();
    }
    pointerLocked() {
        return document.pointerLockElement == this._renderer.elm();
    }
    initKeyListeners() {
        const recordKey = (e) => {
            if (e.repeat)
                return;
            if (e.keyCode == this._chatKeyCode) {
                this.handleChat();
                return;
            }
            if (this._mode != InputMode.GAME)
                return;
            if (!this._keyMap.has(e.keyCode))
                return;
            const key = this._keyMap.get(e.keyCode);
            if (!g_keys.has(key)) {
                g_keys.add(key);
            }
        };
        const releaseKey = (e) => {
            if (e.keyCode == 27 && this._mode != InputMode.PAUSE) {
                this.pointerUnlock();
                this.changeInputMode(InputMode.PAUSE);
                return;
            }
            if (this._mode != InputMode.GAME)
                return;
            if (!this._keyMap.has(e.keyCode))
                return;
            const key = this._keyMap.get(e.keyCode);
            if (g_keys.has(key)) {
                g_keys.delete(key);
            }
        };
        document.addEventListener('keydown', recordKey);
        document.addEventListener('keyup', releaseKey);
    }
    initMouseListener() {
        const recordMouse = (e) => {
            if (!this.pointerLocked()) {
                if (HtmlUtil.elm("cursor").style.visibility != "hidden") {
                    HtmlUtil.elm("cursor").style.visibility = "hidden";
                }
                g_mouse.x = e.clientX;
                g_mouse.y = e.clientY;
            }
            else {
                if (HtmlUtil.elm("cursor").style.visibility != "visible") {
                    HtmlUtil.elm("cursor").style.visibility = "visible";
                }
                g_mouse.x += e.movementX;
                g_mouse.y += e.movementY;
            }
            if (g_mouse.x > window.innerWidth) {
                g_mouse.x = window.innerWidth;
            }
            else if (g_mouse.x < 0) {
                g_mouse.x = 0;
            }
            if (g_mouse.y > window.innerHeight) {
                g_mouse.y = window.innerHeight;
            }
            else if (g_mouse.y < 0) {
                g_mouse.y = 0;
            }
            HtmlUtil.elm("cursor").style.left = (g_mouse.x - this._cursorWidth / 2) + "px";
            HtmlUtil.elm("cursor").style.top = (g_mouse.y - this._cursorHeight / 2) + "px";
            this._renderer.setMouseFromPixels(g_mouse);
        };
        document.addEventListener('mousemove', recordMouse);
        document.onmousedown = (e) => {
            if (this._mode != InputMode.GAME) {
                return;
            }
            let button = mouseClick;
            if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
                button = altMouseClick;
            }
            if (!g_keys.has(button)) {
                g_keys.add(button);
            }
        };
        document.onmouseup = (e) => {
            if (this._mode != InputMode.GAME) {
                return;
            }
            let button = mouseClick;
            if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
                button = altMouseClick;
            }
            g_keys.delete(button);
        };
        HtmlUtil.elm("overlay").onclick = (e) => {
            if (this._mode != InputMode.PAUSE) {
                return;
            }
            this.changeInputMode(InputMode.GAME);
        };
    }
    handleChat() {
        if (this._mode == InputMode.GAME) {
            this.changeInputMode(InputMode.CHAT);
            return;
        }
        if (HtmlUtil.inputElm("message-box").value.length == 0) {
            this.changeInputMode(InputMode.GAME);
            return;
        }
        if (!this._connection.ready()) {
            this.print("Unable to send message, not connected to server!");
        }
        const message = {
            T: chatType,
            Chat: {
                Message: HtmlUtil.inputElm("message-box").value.trim(),
            }
        };
        if (this._connection.send(message)) {
            HtmlUtil.inputElm("message-box").value = "";
            this.changeInputMode(InputMode.GAME);
        }
        else {
            this.print("Failed to send chat message!");
        }
    }
}
