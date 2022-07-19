
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { renderer } from './renderer.js'

export class StatsHandler {
	private _statsComponent : HtmlComponent;

	constructor(component : HtmlComponent) {
		this._statsComponent = component;
	}

	setup() : void {
		this.updateStats();
	}

	private updateStats() {
		const ping = connection.ping();
		const fps = renderer.fps();
		this._statsComponent.text("Ping : " + ping + " | FPS: " + fps);
		setTimeout(() => {
			this.updateStats();
		}, 500);
	}
}