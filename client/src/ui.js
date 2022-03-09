import * as THREE from 'three';
import { Icon } from './icon.js';
import { HtmlUtil, Util } from './util.js';
import { connection } from './connection.js';
import { options } from './options.js';
import { renderer } from './renderer.js';
import { voice } from './voice.js';
var InputMode;
(function (InputMode) {
    InputMode[InputMode["UNKNOWN"] = 0] = "UNKNOWN";
    InputMode[InputMode["PAUSE"] = 1] = "PAUSE";
    InputMode[InputMode["GAME"] = 2] = "GAME";
    InputMode[InputMode["GAME_PAUSE"] = 3] = "GAME_PAUSE";
    InputMode[InputMode["CHAT"] = 4] = "CHAT";
})(InputMode || (InputMode = {}));
class UI {
    constructor() {
        this._divLogin = "div-login";
        this._divGame = "div-game";
        this._divOverlay = "div-overlay";
        this._divMessages = "div-messages";
        this._divStats = "div-stats";
        this._fieldsetClients = "fieldset-clients";
        this._formSendMessage = "form-send-message";
        this._inputMessage = "input-message";
        this._elmCursor = "cursor";
        this._chatKeyCode = 13;
        this._cursorWidth = 20;
        this._cursorHeight = 20;
        this._pointerLockInterval = 3000;
        this._mouse = new THREE.Vector3();
        this._lastPointerLock = 0;
        this._keys = new Set();
        this._mode = InputMode.PAUSE;
        this._keyMap = new Map();
        this._clients = new Map();
    }
    createKeyMsg(seqNum) {
        const mouse = renderer.getMouseWorld();
        const msg = {
            T: keyType,
            Key: {
                S: seqNum,
                K: Array.from(this._keys),
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
        return msg;
    }
    setup() {
        this._keyMap.set(38, upKey);
        this._keyMap.set(87, upKey);
        this._keyMap.set(40, downKey);
        this._keyMap.set(83, downKey);
        this._keyMap.set(37, leftKey);
        this._keyMap.set(65, leftKey);
        this._keyMap.set(39, rightKey);
        this._keyMap.set(68, rightKey);
        this._keyMap.set(32, dashKey);
        connection.addHandler(chatType, (msg) => { this.chat(msg); });
        connection.addHandler(joinType, (msg) => { this.updateClients(msg); });
        connection.addHandler(leftType, (msg) => { this.updateClients(msg); });
        connection.addHandler(joinVoiceType, (msg) => { this.updateClients(msg); });
        connection.addHandler(leftVoiceType, (msg) => { this.updateClients(msg); });
        HtmlUtil.elm("button-voice").onclick = (e) => {
            e.stopPropagation();
            voice.toggleVoice();
        };
        voice.setup();
    }
    displayGame() {
        HtmlUtil.displayNone(this._divLogin);
        HtmlUtil.displayBlock(this._divGame);
        HtmlUtil.elm(this._inputMessage).style.width = HtmlUtil.elm(this._divMessages).offsetWidth + "px";
        window.addEventListener("blur", () => {
            this.changeInputMode(InputMode.PAUSE);
        });
        this.initMouseListener();
        this.initKeyListeners();
        this.changeInputMode(InputMode.GAME);
    }
    updateStats(ping, fps) {
        HtmlUtil.elm(this._divStats).textContent = "Ping : " + ping + " | FPS: " + fps;
    }
    changeInputMode(inputMode) {
        this._mode = inputMode;
        if (this._mode == InputMode.PAUSE) {
            HtmlUtil.displayBlock(this._divOverlay);
            this.pointerUnlock();
        }
        else {
            HtmlUtil.displayNone(this._divOverlay);
        }
        if (this._mode == InputMode.CHAT) {
            HtmlUtil.notSlightlyOpaque(this._divMessages);
            HtmlUtil.selectable(this._divMessages);
            HtmlUtil.displayBlock(this._formSendMessage);
            HtmlUtil.elm(this._divMessages).style.bottom = "2em";
            HtmlUtil.inputElm(this._inputMessage).focus();
            this.pointerUnlock();
        }
        if (this._mode == InputMode.GAME) {
            HtmlUtil.slightlyOpaque(this._divMessages);
            HtmlUtil.unselectable(this._divMessages);
            HtmlUtil.displayNone(this._formSendMessage);
            HtmlUtil.elm(this._divMessages).style.bottom = "1em";
            HtmlUtil.inputElm(this._inputMessage).blur();
            this.pointerLock();
        }
        else {
            if (this._keys.size > 0) {
                this._keys.clear();
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
        if (this._clients.size == 0) {
            for (let [stringId, client] of Object.entries(msg.Clients)) {
                this.addClient(client);
            }
        }
        else if (msg.T == joinType) {
            this.addClient(msg.Client);
        }
        else if (msg.T == leftType) {
            this.removeClient(msg.Client.Id);
        }
    }
    addClient(client) {
        const id = client.Id;
        const html = document.createElement("span");
        html.id = "client-" + id;
        html.textContent = this.clientName(client);
        if (id === connection.id()) {
            html.appendChild(Icon.person());
        }
        html.appendChild(document.createElement("br"));
        HtmlUtil.elm(this._fieldsetClients).appendChild(html);
        this._clients.set(id, html);
    }
    removeClient(id) {
        HtmlUtil.elm(this._fieldsetClients).removeChild(this._clients.get(id));
        this._clients.delete(id);
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
        HtmlUtil.elm(this._divMessages).appendChild(nameSpan);
        this.print(message);
    }
    print(message) {
        const messageSpan = document.createElement("span");
        messageSpan.textContent = message;
        HtmlUtil.elm(this._divMessages).appendChild(messageSpan);
        HtmlUtil.elm(this._divMessages).appendChild(document.createElement("br"));
        HtmlUtil.elm(this._divMessages).scrollTop = HtmlUtil.elm(this._divMessages).scrollHeight;
    }
    pointerLock() {
        if (options.pointerLock) {
            const timeout = Math.max(0, this._pointerLockInterval - (Date.now() - this._lastPointerLock));
            setTimeout(() => {
                renderer.elm().requestPointerLock();
            }, timeout);
        }
    }
    pointerUnlock() {
        document.exitPointerLock();
    }
    pointerLocked() {
        return document.pointerLockElement == renderer.elm();
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
            if (!this._keys.has(key)) {
                this._keys.add(key);
            }
        };
        const releaseKey = (e) => {
            if (e.keyCode == 27 && this._mode != InputMode.PAUSE && !this.pointerLocked()) {
                this.changeInputMode(InputMode.PAUSE);
                return;
            }
            if (this._mode != InputMode.GAME)
                return;
            if (!this._keyMap.has(e.keyCode))
                return;
            const key = this._keyMap.get(e.keyCode);
            if (this._keys.has(key)) {
                this._keys.delete(key);
            }
        };
        document.addEventListener("keydown", recordKey);
        document.addEventListener("keyup", releaseKey);
    }
    initMouseListener() {
        const recordMouse = (e) => {
            if (!this.pointerLocked()) {
                this._mouse.x = e.clientX;
                this._mouse.y = e.clientY;
            }
            else {
                this._mouse.x += e.movementX;
                this._mouse.y += e.movementY;
            }
            if (this._mouse.x > window.innerWidth) {
                this._mouse.x = window.innerWidth;
            }
            else if (this._mouse.x < 0) {
                this._mouse.x = 0;
            }
            if (this._mouse.y > window.innerHeight) {
                this._mouse.y = window.innerHeight;
            }
            else if (this._mouse.y < 0) {
                this._mouse.y = 0;
            }
            HtmlUtil.elm(this._elmCursor).style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
            HtmlUtil.elm(this._elmCursor).style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
            renderer.setMouseFromPixels(this._mouse);
        };
        document.addEventListener("mousemove", recordMouse);
        document.onmousedown = (e) => {
            if (this._mode != InputMode.GAME) {
                return;
            }
            let button = mouseClick;
            if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
                button = altMouseClick;
            }
            if (!this._keys.has(button)) {
                this._keys.add(button);
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
            this._keys.delete(button);
        };
        document.addEventListener("pointerlockchange", (event) => {
            if (this.pointerLocked()) {
                HtmlUtil.show(this._elmCursor);
                this._lastPointerLock = Date.now();
            }
            else {
                HtmlUtil.hide(this._elmCursor);
                if (this._mode == InputMode.GAME) {
                    this.changeInputMode(InputMode.PAUSE);
                }
            }
        });
        document.addEventListener("pointerlockerror", (event) => {
            setTimeout(() => {
                this.pointerLock();
            }, 1000);
        });
        HtmlUtil.elm(this._divOverlay).onclick = (e) => {
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
        if (HtmlUtil.trimmedValue(this._inputMessage).length == 0) {
            this.changeInputMode(InputMode.GAME);
            return;
        }
        if (!connection.ready()) {
            this.print("Unable to send message, not connected to server!");
        }
        const message = {
            T: chatType,
            Chat: {
                Message: HtmlUtil.trimmedValue(this._inputMessage),
            }
        };
        if (connection.send(message)) {
            HtmlUtil.inputElm(this._inputMessage).value = "";
            this.changeInputMode(InputMode.GAME);
        }
        else {
            this.print("Failed to send chat message!");
        }
    }
}
export const ui = new UI();
