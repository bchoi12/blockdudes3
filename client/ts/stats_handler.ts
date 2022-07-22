import { connection } from './connection.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { renderer } from './renderer.js'
import { InputMode } from './ui.js'

export class StatsHandler implements InterfaceHandler {
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
		this._statsElm.textContent = "Ping : " + ping + " | FPS: " + fps;
		setTimeout(() => {
			this.updateStats();
		}, 500);
	}
}