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
	private _customStats : HTMLElement;

	constructor() {
		this._statsElm = Html.elm(Html.divStats);
		this._customStats = Html.span();
		this._statsElm.append(this._customStats);
	}

	setup() : void {
		this.updateStats();
	}

	reset() : void {}

	changeInputMode(mode : InputMode) : void {}

	private updateStats() {
		const ping = connection.ping();
		const fps = renderer.fps();

		let text = "Ping : " + ping + " | FPS: " + fps;

		if (Util.isDev()) {
			text += " | Added/s " + Math.round(game.flushAdded() / this._intervalSec);
			text += " | Extrapolated/s " + Math.round(game.flushExtrapolated() / this._intervalSec);
			text += " | Updates/s: " + Math.round(game.flushUpdated() / this._intervalSec);
			text += " | SetData/s: " + wasmGetStats();
			text += " | Geometries: " + renderer.info().memory.geometries;
			text += " | Textures: " + renderer.info().memory.textures;
			text += " | Draw/s: " + renderer.info().render.calls;
			text += " | Triangles: " + renderer.info().render.triangles;
		}
		this._customStats.textContent = text;
		setTimeout(() => {
			this.updateStats();
		}, this._intervalSec * 1000);
	}
}