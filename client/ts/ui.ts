import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { Client } from './client.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { HtmlUtil, Util } from './util.js'

enum InputMode {
	UNKNOWN = 0,
	PAUSE = 1,
	GAME = 2,
	CHAT = 3,
}

class UI {
	private readonly _divLogin = "div-login";
	private readonly _divGame = "div-game";
	private readonly _divOverlay = "div-overlay";
	private readonly _divMessages = "div-messages";
	private readonly _divStats = "div-stats";

	private readonly _fieldsetClients = "fieldset-clients";

	private readonly _formSendMessage = "form-send-message";
	private readonly _inputMessage = "input-message"

	private readonly _elmCursor = "cursor";

	private readonly _chatKeyCode = 13;
	private readonly _pauseKeyCode = 27;
	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;

	private _mouse : THREE.Vector3;
	private _lastPointerLock : number;
	private _keys : Set<number>;
	private _mode : InputMode;
	private _keyMap : Map<number, number>;

	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;

	constructor() {
		this._mouse = new THREE.Vector3();
		this._lastPointerLock = 0;
		this._keys = new Set<number>();
		this._mode = InputMode.PAUSE;
		this._keyMap = new Map();

		this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(this._divMessages)));
		this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(this._fieldsetClients)));
	}

	setup() : void {
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

	getKeys() : Set<number> { return this._keys; }

	getKeysAsArray() : Array<number> { return Array.from(this._keys) }

	// TODO: delete? this is temporary
	hasClient(id : number) : boolean { return this._clientHandler.hasClient(id); }
	getClient(id : number) : Client { return this._clientHandler.getClient(id); }

	getClientName(id : number) : string {
		return this._clientHandler.hasClient(id) ? this._clientHandler.getClient(id).displayName() : "Unknown";
	}

	startGame() : void {
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

	updateStats(ping : number, fps : number) {
		HtmlUtil.elm(this._divStats).textContent = "Ping : " + ping + " | FPS: " + fps;
	}

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		if (this._mode == InputMode.PAUSE) {
			HtmlUtil.displayBlock(this._divOverlay);	
			this.pointerUnlock();
		} else {
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
		} else {
			if (this._keys.size > 0) {
				this._keys.clear();
			}
		}
	}

	print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		HtmlUtil.elm(this._divMessages).appendChild(messageSpan);
		HtmlUtil.elm(this._divMessages).appendChild(document.createElement("br"));
		HtmlUtil.elm(this._divMessages).scrollTop = HtmlUtil.elm(this._divMessages).scrollHeight;
	}

	private pointerLock() : void {
		if (options.pointerLock) {
			renderer.elm().requestPointerLock();
		}
	}
	private pointerUnlock() : void {
		document.exitPointerLock();
	}
	private pointerLocked() : boolean {
		return document.pointerLockElement === renderer.elm()
	}

	private initKeyListeners() : void {
		const recordKey = (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === this._chatKeyCode) {
				this.handleChat();
				return;
			}

			if (this._mode != InputMode.GAME) return;
			if (!this._keyMap.has(e.keyCode)) return;

			const key = this._keyMap.get(e.keyCode);
			if (!this._keys.has(key)) {
				this._keys.add(key);
			}
		};
		const releaseKey = (e : any) => {
			if (e.keyCode === this._pauseKeyCode) {
				if (this._mode != InputMode.PAUSE) {
					this.changeInputMode(InputMode.PAUSE);
				} else {
					this.changeInputMode(InputMode.GAME);
				}
				return;
			}

			if (this._mode != InputMode.GAME) return;
			if (!this._keyMap.has(e.keyCode)) return;

			const key = this._keyMap.get(e.keyCode);
			if (this._keys.has(key)) {
				this._keys.delete(key);
			}
		};

		document.addEventListener("keydown", recordKey);
		document.addEventListener("keyup", releaseKey);
	}

	private initMouseListener() : void {
		const recordMouse = (e : any) => {
    		if (!this.pointerLocked()) {
    			this._mouse.x = e.clientX;
    			this._mouse.y = e.clientY;
    		} else {
				this._mouse.x += e.movementX;
				this._mouse.y += e.movementY;
	    	}

    		if (this._mouse.x > window.innerWidth) {
    			this._mouse.x = window.innerWidth;
    		} else if (this._mouse.x < 0) {
    			this._mouse.x = 0;
    		}
    		if (this._mouse.y > window.innerHeight) {
    			this._mouse.y = window.innerHeight;
    		} else if (this._mouse.y < 0) {
    			this._mouse.y = 0;
    		}

    		HtmlUtil.elm(this._elmCursor).style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
    		HtmlUtil.elm(this._elmCursor).style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
    		renderer.setMouseFromPixels(this._mouse);
    	};
    	document.addEventListener("mousemove", recordMouse);

		document.onmousedown = (e : any) => {
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
		document.onmouseup = (e : any) => {
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
			if(this.pointerLocked()) {
				HtmlUtil.show(this._elmCursor);
				this._lastPointerLock = Date.now();
			} else {
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

		HtmlUtil.elm(this._divOverlay).onclick = (e : any) => {
			if (this._mode != InputMode.PAUSE) {
				return;
			}
			this.changeInputMode(InputMode.GAME);
		}
	}

	private handleChat() : void {
		if (this._mode === InputMode.GAME) {
			this.changeInputMode(InputMode.CHAT);
			return;
		}

		if (HtmlUtil.trimmedValue(this._inputMessage).length == 0) {
			this.changeInputMode(InputMode.GAME);
			return;
		}

		if (!connection.ready()) {
			this.print("Unable to send message, not connected to server!")
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
		} else {
			this.print("Failed to send chat message!");
		}
	}
}

export const ui = new UI();