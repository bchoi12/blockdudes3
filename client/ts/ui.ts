import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { Client } from './client.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { InputHandler } from './input_handler.js'
import { InterfaceHandler } from './interface_handler.js'
import { LoginHandler } from './login_handler.js'
import { options } from './options.js'
import { PauseHandler } from './pause_handler.js'
import { renderer } from './renderer.js'
import { ScoreboardHandler } from './scoreboard_handler.js'
import { StatsHandler } from './stats_handler.js'
import { HtmlUtil, Util } from './util.js'

export enum InputMode {
	UNKNOWN = 0,
	LOGIN = 1,
	GAME = 2,
	PAUSE = 3,
	CHAT = 4,
}

class UI {
	private _mode : InputMode;
	private _handlers : Array<InterfaceHandler>;

	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;
	private _inputHandler : InputHandler;
	private _loginHandler : LoginHandler;
	private _pauseHandler : PauseHandler;
	private _scoreboardHandler : ScoreboardHandler;
	private _statsHandler : StatsHandler;

	constructor() {
		this._mode = InputMode.UNKNOWN;
		this._handlers = new Array();

		this._chatHandler = new ChatHandler(new HtmlComponent(HtmlUtil.elm(Html.divChat)));
		this._handlers.push(this._chatHandler);

		this._clientHandler = new ClientHandler(new HtmlComponent(HtmlUtil.elm(Html.fieldsetClients)));
		this._handlers.push(this._clientHandler);

		this._inputHandler = new InputHandler();
		this._handlers.push(this._inputHandler);

		this._loginHandler = new LoginHandler(new HtmlComponent(HtmlUtil.elm(Html.divLogin)), new HtmlComponent(HtmlUtil.elm(Html.divGame)));
		this._handlers.push(this._loginHandler);

		this._pauseHandler = new PauseHandler(new HtmlComponent(HtmlUtil.elm(Html.divPause)));
		this._handlers.push(this._pauseHandler);

		this._scoreboardHandler = new ScoreboardHandler(new HtmlComponent(HtmlUtil.elm(Html.divScoreboard)));
		this._handlers.push(this._scoreboardHandler);

		this._statsHandler = new StatsHandler(new HtmlComponent(HtmlUtil.elm(Html.divStats)));
		this._handlers.push(this._statsHandler);
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
	}

	inputMode() : InputMode { return this._mode; }
	getKeys() : Set<number> { return this._inputHandler.keys(); }
	getKeysAsArray() : Array<number> { return Array.from(this._inputHandler.keys()); }
	getClientName(id : number) : string {
		return this._clientHandler.hasClient(id) ? this._clientHandler.getClient(id).displayName() : "Unknown";
	}

	print(message : string) : void { this._chatHandler.print(message); }

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;

		// TODO: in the future this probably belongs somewhere else
		if (inputMode === InputMode.GAME && game.state() !== GameState.GAME) {
			game.setState(GameState.GAME);
		}

		this._handlers.forEach((handler) => {
			handler.changeInputMode(inputMode);
		});
	}
}

export const ui = new UI();