import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { Client } from './client.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { InputHandler } from './input_handler.js'
import { options } from './options.js'
import { PauseHandler } from './pause_handler.js'
import { renderer } from './renderer.js'
import { StatsHandler } from './stats_handler.js'
import { HtmlUtil, Util } from './util.js'

export enum InputMode {
	UNKNOWN = 0,
	PAUSE = 1,
	GAME = 2,
	CHAT = 3,
}

class UI {

	private _mode : InputMode;

	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;
	private _inputHandler : InputHandler;
	private _pauseHandler : PauseHandler;
	private _statsHandler : StatsHandler;

	constructor() {
		this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(Html.divChat)));
		this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(Html.fieldsetClients)));
		this._inputHandler = new InputHandler();
		this._pauseHandler = new PauseHandler(new HtmlComponent(HtmlUtil.elm(Html.divPause)));
		this._statsHandler = new StatsHandler(new HtmlComponent(HtmlUtil.elm(Html.divStats)));
	}

	setup() : void {
		this._mode = InputMode.UNKNOWN;

		// TODO: need parent class + add these to a list
		this._chatHandler.setup();
		this._clientHandler.setup();
		this._inputHandler.setup();
		this._pauseHandler.setup();
		this._statsHandler.setup();
	}

	inputMode() : InputMode { return this._mode; }
	getKeys() : Set<number> { return this._inputHandler.keys(); }
	getKeysAsArray() : Array<number> { return Array.from(this._inputHandler.keys()); }
	print(message : string) : void { this._chatHandler.print(message); }

	// TODO: delete? this is temporary
	hasClient(id : number) : boolean { return this._clientHandler.hasClient(id); }
	getClient(id : number) : Client { return this._clientHandler.getClient(id); }

	getClientName(id : number) : string {
		return this._clientHandler.hasClient(id) ? this._clientHandler.getClient(id).displayName() : "Unknown";
	}

	startGame() : void {
		HtmlUtil.displayNone(Html.divLogin);
		HtmlUtil.displayBlock(Html.divGame);
		this.changeInputMode(InputMode.GAME);
	}

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		this._chatHandler.changeInputMode(this._mode);
		this._inputHandler.changeInputMode(this._mode);
		this._pauseHandler.changeInputMode(this._mode); 
	}
}

export const ui = new UI();