import * as THREE from 'three';

import { HtmlUtil, Util } from './util.js'

import { connection } from './connection.js'
import { renderer } from './renderer.js'
import { voice } from './voice.js'

enum InputMode {
	UNKNOWN = 0,
	PAUSE = 1,
	GAME = 2,
	CHAT = 3,
}

class UI {
	private readonly _divGame = "div-game";

	private readonly _chatKeyCode = 13;
	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;

	private _div : HTMLElement;

	private _mouse : THREE.Vector3;
	private _keys : Set<number>;
	private _mode : InputMode;
	private _keyMap : Map<number, number>;

	private _clients : Map<number, HTMLElement>;

	constructor() {
		this._div = HtmlUtil.elm(this._divGame);

		this._mouse = new THREE.Vector3();
		this._keys = new Set<number>();
		this._mode = InputMode.PAUSE;
		this._keyMap = new Map();
		this._clients = new Map();
	}

	createKeyMsg(seqNum : number) : any {
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

	setup() : void {
		this._keyMap.set(38, upKey);
		this._keyMap.set(87, upKey);
		this._keyMap.set(40, downKey);
		this._keyMap.set(83, downKey);
		this._keyMap.set(37, leftKey);
		this._keyMap.set(65, leftKey);
		this._keyMap.set(39, rightKey);
		this._keyMap.set(68, rightKey);
		this._keyMap.set(32, dashKey);

		connection.addHandler(chatType, (msg : any) => { this.chat(msg) })
 		connection.addHandler(joinType, (msg : any) => { this.updateClients(msg) });
		connection.addHandler(leftType, (msg : any) => { this.updateClients(msg) });
		connection.addHandler(joinVoiceType, (msg : any) => { this.updateClients(msg) });
		connection.addHandler(leftVoiceType, (msg : any) => { this.updateClients(msg) });

		HtmlUtil.elm("voice").onclick = (e) => {
			e.stopPropagation();
			voice.toggleVoice();
		};
		voice.setup();
	}

	displayGame() : void {
		HtmlUtil.elm("div-login").style.display = "none";
		this._div.style.display = "block";
		HtmlUtil.elm("message-box").style.width = HtmlUtil.elm("messages").offsetWidth + "px";

		window.addEventListener("blur", () => {
			this.changeInputMode(InputMode.PAUSE);
		});

		this.initMouseListener();
		this.initKeyListeners();
		this.changeInputMode(InputMode.GAME);
	}

	updateStats(ping : number, fps : number) {
		HtmlUtil.elm("stats").textContent = "Ping : " + ping + " | FPS: " + fps;
	}

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		if (this._mode == InputMode.PAUSE) {
			HtmlUtil.elm("overlay").style.display = "block";	
			this.pointerUnlock();
		} else {
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
		} else {
			if (this._keys.size > 0) {
				this._keys.clear();
			}
		}
	}

	private clientName(client : any) : string {
		return client.Name + " #" + client.Id;
	}

	private updateClients(msg : any) : void {
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
			for (let [stringId, client] of Object.entries(msg.Clients) as [string, any]) {
				this.addClient(client);
			}
		} else if (msg.T == joinType) {
			this.addClient(msg.Client)
		} else if (msg.T == leftType) {
			this.removeClient(msg.Client.Id);
		}
	}

	private addClient(client : any) : void {
		const id = client.Id;
		const html = document.createElement("span");
		html.id = "client-" + id;
		html.textContent = this.clientName(client);
		html.appendChild(document.createElement("br"));

		HtmlUtil.elm("clients").appendChild(html);
		this._clients.set(id, html);
	}

	private removeClient(id : number) : void {
		HtmlUtil.elm("clients").removeChild(this._clients.get(id));
		this._clients.delete(id);
	}

	private print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		HtmlUtil.elm("messages").appendChild(messageSpan);
		HtmlUtil.elm("messages").appendChild(document.createElement("br"));
		HtmlUtil.elm("messages").scrollTop = HtmlUtil.elm("messages").scrollHeight;
	}

	private chat(msg : any) : void {
		const name = this.clientName(msg.Client)
		const message = msg.Message;

		if (!Util.defined(name) || !Util.defined(message)) return;
		if (name.length == 0 || message.length == 0) return;

		const nameSpan = document.createElement("span");
		nameSpan.classList.add("message-name");
		nameSpan.textContent = name + ": ";

		HtmlUtil.elm("messages").appendChild(nameSpan);
		this.print(message);
	}

	private pointerLock() : void {
		renderer.elm().requestPointerLock();
	}
	private pointerUnlock() : void {
		document.exitPointerLock();
	}
	private pointerLocked() : boolean {
		return document.pointerLockElement == renderer.elm()
	}

	private initKeyListeners() : void {
		const recordKey = (e : any) => {
			if (e.repeat) return;

			if (e.keyCode == this._chatKeyCode) {
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
			if (e.keyCode == 27 && this._mode != InputMode.PAUSE) {
				this.pointerUnlock();
				this.changeInputMode(InputMode.PAUSE);
				return;
			}

			if (this._mode != InputMode.GAME) return;
			if (!this._keyMap.has(e.keyCode)) return;

			const key = this._keyMap.get(e.keyCode);
			if (this._keys.has(key)) {
				this._keys.delete(key);
			}
		};

		document.addEventListener('keydown', recordKey);
		document.addEventListener('keyup', releaseKey);
	}

	private initMouseListener() : void {
		const recordMouse = (e : any) => {
    		if (!this.pointerLocked()) {
    			if (HtmlUtil.elm("cursor").style.visibility != "hidden") {
					HtmlUtil.elm("cursor").style.visibility = "hidden";
				}
    			this._mouse.x = e.clientX;
    			this._mouse.y = e.clientY;
    		} else {
    			if (HtmlUtil.elm("cursor").style.visibility != "visible") {
					HtmlUtil.elm("cursor").style.visibility = "visible";
				}
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

    		HtmlUtil.elm("cursor").style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
    		HtmlUtil.elm("cursor").style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
    		renderer.setMouseFromPixels(this._mouse);
    	};
    	document.addEventListener('mousemove', recordMouse);

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

		HtmlUtil.elm("overlay").onclick = (e : any) => {
			if (this._mode != InputMode.PAUSE) {
				return;
			}
			this.changeInputMode(InputMode.GAME);
		}
	}

	private handleChat() : void {
		if (this._mode == InputMode.GAME) {
			this.changeInputMode(InputMode.CHAT);
			return;
		}

		if (HtmlUtil.inputElm("message-box").value.length == 0) {
			this.changeInputMode(InputMode.GAME);
			return;
		}

		if (!connection.ready()) {
			this.print("Unable to send message, not connected to server!")
		}

		const message = {
			T: chatType,
			Chat: {
				Message: HtmlUtil.inputElm("message-box").value.trim(),
			}
		};

		if (connection.send(message)) {
			HtmlUtil.inputElm("message-box").value = "";
			this.changeInputMode(InputMode.GAME);
		} else {
			this.print("Failed to send chat message!");
		}
	}
}

export const ui = new UI();