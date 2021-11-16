enum InputMode {
	UNKNOWN = 0,
	PAUSE = 1,
	GAME = 2,
	CHAT = 3,
}

class UI {
	private readonly _chatKeyCode = 13;

	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;

	private _div : HTMLElement;
	private _renderer : Renderer;
	private _connection : Connection;

	private _mode : InputMode;
	private _mouse : any;
	private _keys : Set<number>;
	private _keyMap : Map<number, number>;

	private _clients : Map<number, HTMLElement>;
	private _voice : Voice;

	constructor(div : HTMLElement, connection : Connection) {
		this._div = div;
		this._renderer = new Renderer(elm("renderer"));
		this._connection = connection;

		this._connection.addHandler(chatType, (msg : any) => { this.chat(msg) })
 		this._connection.addHandler(joinType, (msg : any) => { this.updateClients(msg) });
		this._connection.addHandler(leftType, (msg : any) => { this.updateClients(msg) });
		this._connection.addHandler(joinVoiceType, (msg : any) => { this.updateClients(msg) })
		this._connection.addHandler(leftVoiceType, (msg : any) => { this.updateClients(msg) })

		this._mode = InputMode.PAUSE;

		this._mouse = new THREE.Vector3();
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
		this._keyMap.set(32, dashKey);

		this._clients = new Map();
		this._voice = new Voice(connection);

		elm("voice").onclick = (e) => {
			e.stopPropagation();

			this.toggleVoice();
		};
	}

	addDiv(div : HTMLElement) : void {
		// TODO
	}

	toggleVoice() : void {
		this._voice.toggleVoice();
	}

	keys() : Set<number> { return this._keys; }
	createKeyMsg() : any {
		const msg = {
			T: keyType,
			Key: {
				K: Array.from(this._keys),
				M: {},
			},
		};

   		const mouse = this._renderer.getMouseWorld();
		if (defined(mouse)) {
			msg.Key.M = {
				X: mouse.x,
				Y: mouse.y,
			}
		}	
		return msg;
	}

	renderer() : Renderer { return this._renderer; }

	displayGame() : void {
		elm("div-login").style.display = "none";
		this._div.style.display = "block";
		elm("message-box").style.width = elm("messages").offsetWidth + "px";

		window.addEventListener("blur", () => {
			this.changeInputMode(InputMode.PAUSE);
		});


		this.initMouseListener();
		this.initKeyListeners();
	}

	updateStats(ping : number, fps : number) {
		elm("stats").textContent = "Ping : " + ping + " | FPS: " + fps;
	}

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		if (this._mode == InputMode.PAUSE) {
			elm("overlay").style.display = "block";	
			this.pointerUnlock();
		} else {
			elm("overlay").style.display = "none";	
		}

		if (this._mode == InputMode.CHAT) {
			elm("messages").classList.remove("chat-hide");
			elm("messages").classList.remove("no-select");
			elm("messages").style.bottom = "2em";
			inputElm("form-send-message").style.display = "block";
			inputElm("message-box").focus();
			this.pointerUnlock();
		}

		if (this._mode == InputMode.GAME) {
			elm("messages").classList.add("chat-hide");
			elm("messages").classList.add("no-select");
			elm("messages").style.bottom = "1em";
			inputElm("form-send-message").style.display = "none";
			inputElm("message-box").blur();
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

		const addClient = (client : any) => {
			const id = client.Id;
			const html = document.createElement("span");
			html.id = "client-" + id;
			html.textContent = this.clientName(client);
			html.appendChild(document.createElement("br"));

			elm("clients").appendChild(html);
			this._clients.set(id, html);
		};
		const removeClient = (id : number) => {
			elm("clients").removeChild(this._clients.get(id));
			this._clients.delete(id);
		};

		if (this._clients.size == 0) {
			for (let [stringId, client] of Object.entries(msg.Clients) as [string, any]) {
				addClient(client);
			}
		} else if (msg.T == joinType) {
			addClient(msg.Client)
		} else if (msg.T == leftType) {
			removeClient(msg.Client.Id);
		}
	}

	private print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		elm("messages").appendChild(messageSpan);
		elm("messages").appendChild(document.createElement("br"));
		elm("messages").scrollTop = elm("messages").scrollHeight;
	}

	private chat(msg : any) : void {
		const name = this.clientName(msg.Client)
		const message = msg.Message;

		if (!defined(name) || !defined(message)) return;
		if (name.length == 0 || message.length == 0) return;

		const nameSpan = document.createElement("span");
		nameSpan.classList.add("message-name");
		nameSpan.textContent = name + ": ";

		elm("messages").appendChild(nameSpan);
		this.print(message);
	}

	private pointerLock() : void {
		this._renderer.elm().requestPointerLock();
	}
	private pointerUnlock() : void {
		document.exitPointerLock();
	}
	private pointerLocked() : boolean {
		return document.pointerLockElement == this._renderer.elm()
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
    			if (elm("cursor").style.visibility != "hidden") {
					elm("cursor").style.visibility = "hidden";
				}
    			this._mouse.x = e.clientX;
    			this._mouse.y = e.clientY;
    		} else {
    			if (elm("cursor").style.visibility != "visible") {
					elm("cursor").style.visibility = "visible";
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

    		elm("cursor").style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
    		elm("cursor").style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
    		this._renderer.setMouseFromPixels(this._mouse);
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

		elm("overlay").onclick = (e : any) => {
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

		if (inputElm("message-box").value.length == 0) {
			this.changeInputMode(InputMode.GAME);
			return;
		}

		if (!this._connection.ready()) {
			this.print("Unable to send message, not connected to server!")
		}

		const message = {
			T: chatType,
			Chat: {
				Message: inputElm("message-box").value.trim(),
			}
		};

		if (this._connection.send(message)) {
			inputElm("message-box").value = "";
			this.changeInputMode(InputMode.GAME);
		} else {
			this.print("Failed to send chat message!");
		}
	}
}