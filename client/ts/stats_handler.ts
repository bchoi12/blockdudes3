
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { InterfaceHandler } from './interface_handler.js'
import { renderer } from './renderer.js'
import { InputMode } from './ui.js'

export class StatsHandler implements InterfaceHandler {
	private _statsComponent : HtmlComponent;

	constructor(component : HtmlComponent) {
		this._statsComponent = component;
	}

	setup() : void {
		this.updateStats();
	}

	changeInputMode(mode : InputMode) : void {}

	private updateStats() {
		const ping = connection.ping();
		const fps = renderer.fps();
		this._statsComponent.text("Ping : " + ping + " | FPS: " + fps);
		setTimeout(() => {
			this.updateStats();
		}, 500);
	}
}