import * as THREE from 'three';

import { ChatHandler } from './chat_handler.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { Icon } from './icon.js'
import { InputHandler } from './input_handler.js'
import { InterfaceHandler } from './interface_handler.js'
import { LoginHandler } from './login_handler.js'
import { options } from './options.js'
import { PauseHandler } from './pause_handler.js'
import { renderer } from './renderer.js'
import { ScoreboardHandler } from './scoreboard_handler.js'
import { StatsHandler } from './stats_handler.js'
import { Util } from './util.js'

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

		this._chatHandler = new ChatHandler();
		this._handlers.push(this._chatHandler);

		this._clientHandler = new ClientHandler();
		this._handlers.push(this._clientHandler);

		this._inputHandler = new InputHandler();
		this._handlers.push(this._inputHandler);

		this._loginHandler = new LoginHandler();
		this._handlers.push(this._loginHandler);

		this._pauseHandler = new PauseHandler();
		this._handlers.push(this._pauseHandler);

		this._scoreboardHandler = new ScoreboardHandler();
		this._handlers.push(this._scoreboardHandler);

		this._statsHandler = new StatsHandler();
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
	getClientName(id : number) : string { return this._clientHandler.displayName(id); }

	// TODO: add something better for disconnect
	disconnected() : void {
		game.reset();
		this.changeInputMode(InputMode.LOGIN);
		this.print("Error: disconnected from server.")
	}
	print(message : string) : void { this._chatHandler.print(message); }

	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;
		this._handlers.forEach((handler) => {
			handler.changeInputMode(inputMode);
		});
	}
}

export const ui = new UI();