import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { Client } from './client.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { InputHandler, InputMode } from './input_handler.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { StatsHandler } from './stats_handler.js'
import { HtmlUtil, Util } from './util.js'

class UI {
	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;
	private _inputHandler : InputHandler;
	private _statsHandler : StatsHandler;

	constructor() {
		this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(Html.divChat)));
		this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(Html.fieldsetClients)));
		this._inputHandler = new InputHandler();
		this._statsHandler = new StatsHandler(new HtmlComponent(HtmlUtil.elm(Html.divStats)));
	}

	setup() : void {
		HtmlUtil.elm(Html.divPause).onclick = (e : any) => {
			if (this._inputHandler.mode() != InputMode.PAUSE) {
				return;
			}
			this.changeInputMode(InputMode.GAME);
		}

		this._chatHandler.setup();
		this._clientHandler.setup();
		this._inputHandler.setup();
		this._statsHandler.setup();
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
		HtmlUtil.elm(Html.inputMessage).style.width = HtmlUtil.elm(Html.divChat).offsetWidth + "px";
		window.addEventListener("blur", () => {
			this.changeInputMode(InputMode.PAUSE);
		});

		this.changeInputMode(InputMode.GAME);
	}

	changeInputMode(inputMode : InputMode) : void {
		this._inputHandler.changeInputMode(inputMode);

		if (inputMode === InputMode.PAUSE) {
			HtmlUtil.displayBlock(Html.divPause);	
		} else {
			HtmlUtil.displayNone(Html.divPause);
		}

		if (inputMode === InputMode.CHAT) {
			HtmlUtil.notSlightlyOpaque(Html.divChat);
			HtmlUtil.selectable(Html.divChat);
			HtmlUtil.displayBlock(Html.divMessage);
			HtmlUtil.elm(Html.divChat).style.bottom = "2em";
			HtmlUtil.inputElm(Html.inputMessage).focus();
		}

		if (inputMode === InputMode.GAME) {
			HtmlUtil.displayNone(Html.divLogin);
			HtmlUtil.displayBlock(Html.divGame);

			HtmlUtil.slightlyOpaque(Html.divChat);
			HtmlUtil.unselectable(Html.divChat);
			HtmlUtil.displayNone(Html.divMessage);
			HtmlUtil.elm(Html.divChat).style.bottom = "1em";
			HtmlUtil.inputElm(Html.inputMessage).blur();
		}
	}

	// TODO: ChatHandler
	print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		HtmlUtil.elm(Html.divChat).appendChild(messageSpan);
		HtmlUtil.elm(Html.divChat).appendChild(document.createElement("br"));
		HtmlUtil.elm(Html.divChat).scrollTop = HtmlUtil.elm(Html.divChat).scrollHeight;
	}

	handleChat() : void {
		if (this._inputHandler.mode() === InputMode.GAME) {
			this.changeInputMode(InputMode.CHAT);
			return;
		}

		if (HtmlUtil.trimmedValue(Html.inputMessage).length == 0) {
			this.changeInputMode(InputMode.GAME);
			return;
		}

		if (!connection.ready()) {
			this.print("Unable to send message, not connected to server!")
		}

		const message = {
			T: chatType,
			Chat: {
				M: HtmlUtil.trimmedValue(Html.inputMessage),
			}
		};

		if (connection.send(message)) {
			HtmlUtil.inputElm(Html.inputMessage).value = "";
			this.changeInputMode(InputMode.GAME);
		} else {
			this.print("Failed to send chat message!");
		}
	}
}

export const ui = new UI();