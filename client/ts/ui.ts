import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { Client } from './client.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { InputHandler, InputMode } from './input_handler.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { HtmlUtil, Util } from './util.js'

class UI {
	// TODO: make DivHandler for easy access to these containers
	private readonly _divLogin = "div-login";
	private readonly _divGame = "div-game";
	private readonly _divOverlay = "div-overlay";
	private readonly _divMessages = "div-messages";
	private readonly _divStats = "div-stats";
	private readonly _fieldsetClients = "fieldset-clients";
	private readonly _formSendMessage = "div-send-message";
	private readonly _inputMessage = "input-message"

	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;
	private _inputHandler : InputHandler;

	constructor() {
		this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(this._divMessages)));
		this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(this._fieldsetClients)));
		this._inputHandler = new InputHandler();
	}

	setup() : void {
		HtmlUtil.elm("button-voice").onclick = (e) => {
			this._clientHandler.toggleVoice();
			e.stopPropagation();
		};
		HtmlUtil.elm(this._divOverlay).onclick = (e : any) => {
			if (this._inputHandler.mode() != InputMode.PAUSE) {
				return;
			}
			this.changeInputMode(InputMode.GAME);
		}

		this._chatHandler.setup();
		this._clientHandler.setup();
		this._inputHandler.setup();
	}

	getKeys() : Set<number> { return this._inputHandler.keys(); }
	getKeysAsArray() : Array<number> { return Array.from(this._inputHandler.keys()); }

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

		this.changeInputMode(InputMode.GAME);
	}

	updateStats(ping : number, fps : number) {
		HtmlUtil.elm(this._divStats).textContent = "Ping : " + ping + " | FPS: " + fps;
	}

	changeInputMode(inputMode : InputMode) : void {
		this._inputHandler.changeInputMode(inputMode);

		if (inputMode === InputMode.PAUSE) {
			HtmlUtil.displayBlock(this._divOverlay);	
		} else {
			HtmlUtil.displayNone(this._divOverlay);
		}

		if (inputMode === InputMode.CHAT) {
			HtmlUtil.notSlightlyOpaque(this._divMessages);
			HtmlUtil.selectable(this._divMessages);
			HtmlUtil.displayBlock(this._formSendMessage);
			HtmlUtil.elm(this._divMessages).style.bottom = "2em";
			HtmlUtil.inputElm(this._inputMessage).focus();
		}

		if (inputMode === InputMode.GAME) {
			HtmlUtil.slightlyOpaque(this._divMessages);
			HtmlUtil.unselectable(this._divMessages);
			HtmlUtil.displayNone(this._formSendMessage);
			HtmlUtil.elm(this._divMessages).style.bottom = "1em";
			HtmlUtil.inputElm(this._inputMessage).blur();
		}
	}

	print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		HtmlUtil.elm(this._divMessages).appendChild(messageSpan);
		HtmlUtil.elm(this._divMessages).appendChild(document.createElement("br"));
		HtmlUtil.elm(this._divMessages).scrollTop = HtmlUtil.elm(this._divMessages).scrollHeight;
	}

	handleChat() : void {
		if (this._inputHandler.mode() === InputMode.GAME) {
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