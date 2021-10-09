enum InputMode {
	DEFAULT = 0,
	GAME = 1,
	CHAT = 2,
}

class UI {
	private readonly _chatKeyCode = 13;

	private _div : HTMLElement;
	private _renderer : Renderer;
	private _connection : Connection;

	private _mode : InputMode;
	private _keys : Set<number>;
	private _keyMap : Map<number, number>;
	private _mouse : any;

	constructor(div : HTMLElement, connection : Connection) {
		// TODO: set up game divs programatically
		this._div = div;
		this._renderer = new Renderer(elm("renderer"));
		this._connection = connection;
		this.initHandlers();

		this._mode = InputMode.DEFAULT;
		this._keys = new Set();
		this._mouse = new THREE.Vector3();

		this._keyMap = new Map();
		this._keyMap.set(38, upKey)
		this._keyMap.set(87, upKey)
		this._keyMap.set(40, downKey)
		this._keyMap.set(83, downKey)
		this._keyMap.set(37, leftKey)
		this._keyMap.set(65, leftKey)
		this._keyMap.set(39, rightKey)
		this._keyMap.set(68, rightKey)
	}

	addDiv(div : HTMLElement) : void {
		// TODO
	}

	mouse() : any { return this._mouse; }
	keys() : Set<number> { return this._keys; }
	createKeyMsg() : any {
   		const mouse = this._renderer.getMouse(this._mouse.clone());
		return {
			T: keyType,
			Key: {
				K: Array.from(this._keys),
				M: {
					X: mouse.x,
					Y: mouse.y,
				},
			},
		};		
	}

	renderer() : Renderer { return this._renderer; }

	displayGame() : void {
		elm("div-login").style.display = "none";
		this._div.style.display = "block";
		elm("messages").style.bottom = (elm("form-send-message").offsetHeight + 4) + "px";
		elm("message-box").style.width = elm("messages").offsetWidth + "px";

		this.changeInputMode(InputMode.GAME);
		this.initMouseListener();
		this.initKeyListeners();
	}

	updateStats(ping : number, fps : number) {
		elm("stats").textContent = "Ping : " + ping + " | FPS: " + fps;
	}

	updateClients(msg : any) : void {
		const id = "" + msg.Id;
		switch (msg.T) {
			case joinType:
				this.system(msg.C.N + " #" + id + " just joined!");
				break;
			case leftType:
				this.system(msg.C.N + " #" + id + " left");
				break;
		}

		elm("people").innerHTML = "";
		for (let [id, client] of Object.entries(msg.Cs) as [string, any]) {
			const html = document.createElement("span");
			html.textContent = client.N + " #" + id;

			elm("people").appendChild(html);
			elm("people").appendChild(document.createElement("br"));		    
		};
	}

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		if (this._mode == InputMode.CHAT) {
			elm("messages").classList.remove("chat-hide");
			elm("messages").classList.remove("no-select");
			inputElm("form-send-message").style.display = "block";
			inputElm("message-box").focus();
		} else if (this._mode == InputMode.GAME) {
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

	system(message : string) : void {
		this.chat({
			N: "",
			M: message,
		});
	}

	chat(msg : any) : void {
		const name = msg.N;
		const message = msg.M;

		if (!defined(name) || !defined(message)) return;
		if (message.length == 0) return;

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

	private initHandlers() : void {
		this._connection.addHandler(chatType, (msg : any) => { this.chat(msg) })
 		this._connection.addHandler(joinType, (msg : any) => { this.updateClients(msg) });
		this._connection.addHandler(leftType, (msg : any) => { this.updateClients(msg) });
	}

	private initMouseListener() : void {
		const recordMouse = (e : any) => {
			this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    		this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    		this._mouse.z = 0.5;
		};
		const recordMouseDown = (e : any) => {
			if (!this._keys.has(mouseClick)) {
				this._keys.add(mouseClick);
			}
		};
		const recordMouseUp = (e : any) => {
			this._keys.delete(mouseClick);
		};


		document.addEventListener('mousemove', recordMouse);
		document.onmousedown = recordMouseDown;
		document.onmouseup = recordMouseUp;
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

	private handleChat() : void {
		if (this._mode == InputMode.GAME) {
			this.changeInputMode(InputMode.CHAT);
			if (this._keys.size > 0) {
				this._keys.clear();
			}
			return;
		}

		if (inputElm("message-box").value.length == 0) {
			this.changeInputMode(InputMode.GAME);
			return;
		}

		if (!this._connection.ready()) {
			this.system("Unable to send message, not connected to server!")
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
		} else {
			this.system("Failed to send chat message!");
		}
	}
}