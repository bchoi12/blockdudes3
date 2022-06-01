import * as THREE from 'three';
import { ChatHandler } from './chat_handler.js';
import { ClientHandler } from './client_handler.js';
import { connection } from './connection.js';
import { HtmlComponent } from './html_component.js';
import { options } from './options.js';
import { renderer } from './renderer.js';
import { HtmlUtil } from './util.js';
var InputMode;
(function (InputMode) {
    InputMode[InputMode["UNKNOWN"] = 0] = "UNKNOWN";
    InputMode[InputMode["PAUSE"] = 1] = "PAUSE";
    InputMode[InputMode["GAME"] = 2] = "GAME";
    InputMode[InputMode["CHAT"] = 3] = "CHAT";
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
        this._pauseKeyCode = 27;
        this._cursorWidth = 20;
        this._cursorHeight = 20;
        this._mouse = new THREE.Vector3();
        this._lastPointerLock = 0;
        this._keys = new Set();
        this._mode = InputMode.PAUSE;
        this._keyMap = new Map();
        this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(this._divMessages)));
        this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(this._fieldsetClients)));
    }
    setup() {
        this._keyMap.set(37, leftKey);
        this._keyMap.set(65, leftKey);
        this._keyMap.set(39, rightKey);
        this._keyMap.set(68, rightKey);
        this._keyMap.set(32, dashKey);
        this._keyMap.set(38, dashKey);
        this._keyMap.set(69, interactKey);
        HtmlUtil.elm("button-voice").onclick = (e) => {
            this._clientHandler.toggleVoice();
            e.stopPropagation();
        };
        this._chatHandler.setup();
        this._clientHandler.setup();
    }
    getKeys() {
        return Array.from(this._keys);
    }
    hasClient(id) { return this._clientHandler.hasClient(id); }
    getClient(id) { return this._clientHandler.getClient(id); }
    getClientName(id) {
        return this._clientHandler.hasClient(id) ? this._clientHandler.getClient(id).displayName() : "Unknown";
    }
    startGame() {
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
    print(message) {
        const messageSpan = document.createElement("span");
        messageSpan.textContent = message;
        HtmlUtil.elm(this._divMessages).appendChild(messageSpan);
        HtmlUtil.elm(this._divMessages).appendChild(document.createElement("br"));
        HtmlUtil.elm(this._divMessages).scrollTop = HtmlUtil.elm(this._divMessages).scrollHeight;
    }
    pointerLock() {
        if (options.pointerLock) {
            renderer.elm().requestPointerLock();
        }
    }
    pointerUnlock() {
        document.exitPointerLock();
    }
    pointerLocked() {
        return document.pointerLockElement === renderer.elm();
    }
    initKeyListeners() {
        const recordKey = (e) => {
            if (e.repeat)
                return;
            if (e.keyCode === this._chatKeyCode) {
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
            if (e.keyCode === this._pauseKeyCode) {
                if (this._mode != InputMode.PAUSE) {
                    this.changeInputMode(InputMode.PAUSE);
                }
                else {
                    this.changeInputMode(InputMode.GAME);
                }
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
                if (this._mode === InputMode.GAME) {
                    this.changeInputMode(InputMode.PAUSE);
                }
            }
        });
        document.addEventListener("pointerlockerror", (event) => {
            setTimeout(() => {
                if (this._mode === InputMode.GAME) {
                    this.pointerLock();
                }
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
        if (this._mode === InputMode.GAME) {
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
                M: HtmlUtil.trimmedValue(this._inputMessage),
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
