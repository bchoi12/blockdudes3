import * as THREE from 'three';

import { Announcement, AnnouncementHandler } from './announcement_handler.js'
import { ChatHandler } from './chat_handler.js'
import { ClientHandler } from './client_handler.js'
import { connection } from './connection.js'
import { game, GameInputMode } from './game.js'
import { Html } from './html.js'
import { Icon } from './icon.js'
import { InputHandler } from './input_handler.js'
import { InterfaceHandler } from './interface_handler.js'
import { KeyBindingsHandler } from './key_bindings_handler.js'
import { LoginHandler } from './login_handler.js'
import { options } from './options.js'
import { OptionsHandler } from './options_handler.js'
import { PauseHandler } from './pause_handler.js'
import { renderer } from './renderer.js'
import { ScoreboardHandler } from './scoreboard_handler.js'
import { StatsHandler } from './stats_handler.js'
import { Tooltip, TooltipHandler } from './tooltip_handler.js'
import { Util } from './util.js'

export enum InputMode {
	UNKNOWN = 0,
	LOGIN = 1,
	GAME = 2,
	PAUSE = 3,
	CHAT = 4,
}

export enum TooltipType {
	UNKNOWN = 0,
	PICKUP = 1,
	JOIN_TEAM = 2,
	PREVENT_VIP = 3,
	SPECTATING = 4,
}

export enum AnnouncementType {
	UNKNOWN = 0,
	WELCOME = 1,
	PROTECT = 2,
	REACH = 3,
	ELIMINATE = 4,
	SCORE = 5,
}

class UI {
	private _mode : InputMode;
	private _handlers : Array<InterfaceHandler>;

	private _announcementHandler : AnnouncementHandler;
	private _chatHandler : ChatHandler;
	private _clientHandler : ClientHandler;
	private _inputHandler : InputHandler;
	private _keyBindingsHandler : KeyBindingsHandler;
	private _loginHandler : LoginHandler;
	private _optionsHandler : OptionsHandler;
	private _pauseHandler : PauseHandler;
	private _scoreboardHandler : ScoreboardHandler;
	private _statsHandler : StatsHandler;
	private _tooltipHandler : TooltipHandler;

	constructor() {
		this._mode = InputMode.UNKNOWN;
		this._handlers = new Array();

		this._announcementHandler = new AnnouncementHandler();
		this._handlers.push(this._announcementHandler);

		this._chatHandler = new ChatHandler();
		this._handlers.push(this._chatHandler);

		this._clientHandler = new ClientHandler();
		this._handlers.push(this._clientHandler);

		this._inputHandler = new InputHandler();
		this._handlers.push(this._inputHandler);

		this._keyBindingsHandler = new KeyBindingsHandler();
		this._handlers.push(this._keyBindingsHandler);

		this._loginHandler = new LoginHandler();
		this._handlers.push(this._loginHandler);

		this._optionsHandler = new OptionsHandler();
		this._handlers.push(this._optionsHandler);

		this._pauseHandler = new PauseHandler();
		this._handlers.push(this._pauseHandler);

		this._scoreboardHandler = new ScoreboardHandler();
		this._handlers.push(this._scoreboardHandler);

		this._statsHandler = new StatsHandler();
		this._handlers.push(this._statsHandler);

		this._tooltipHandler = new TooltipHandler();
		this._handlers.push(this._tooltipHandler);
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
	}

	reset() : void {
		this._handlers.forEach((handler) => {
			handler.reset();
		});
	}

	inputMode() : InputMode { return this._mode; }
	updateKeyBindings() : void { this._inputHandler.reset(); }
	getKeys() : Set<number> { return this._inputHandler.keys(); }
	getKeysAsArray() : Array<number> { return Array.from(this._inputHandler.keys()); }
	hasClient(id : number) : boolean { return this._clientHandler.hasClient(id); }
	getClientName(id : number) : string { return this._clientHandler.displayName(id); }
	voiceEnabled() : boolean { return this._clientHandler.voiceEnabled(); }

	announce(announcement : Announcement) { this._announcementHandler.announce(announcement); }
	tooltip(tooltip : Tooltip) { this._tooltipHandler.tooltip(tooltip); }
	disconnected() : void {
		game.setInputMode(GameInputMode.PAUSE);
		this.changeInputMode(InputMode.LOGIN);
		this.print("Error: disconnected from server.")
	}
	print(message : string) : void {
		this._chatHandler.print(message);
	}

	toggleVoice() : void { this._clientHandler.toggleVoice(); }
	changeInputMode(inputMode : InputMode) : void {
		this._mode = inputMode;
		this._handlers.forEach((handler) => {
			handler.changeInputMode(inputMode);
		});
	}
}

export const ui = new UI();