import { connection } from './connection.js'
import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { renderer } from './renderer.js'
import { InputMode } from './ui.js'
import { Util } from './util.js'

export class StatsHandler implements InterfaceHandler {
	private readonly _intervalSec = 0.5;
	private _statsElm : HTMLElement;

	constructor() {
		this._statsElm = Html.elm(Html.divStats);
	}

	setup() : void {
		this.updateStats();
	}

	changeInputMode(mode : InputMode) : void {}

	private updateStats() {
		const ping = connection.ping();
		const fps = renderer.fps();

		let text = "Ping : " + ping + " | FPS: " + fps;
		text += " | Added/s " + Math.round(game.flushAdded() / this._intervalSec);
		text += " | Updates/s: " + Math.round(game.flushUpdated() / this._intervalSec);
		text += " | SetData/s: " + wasmGetStats();

		this._statsElm.textContent = text;
		setTimeout(() => {
			this.updateStats();
		}, this._intervalSec * 1000);
	}
}