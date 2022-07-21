import { HtmlComponent } from './html_component.js'
import { ui } from './ui.js'

export class ScoreComponent extends HtmlComponent {
	private _name : string;
	private _kills : number;
	private _deaths : number;

	constructor(id : number, html : HTMLElement) {
		super(html);

		this._name = ui.getClientName(id);
		this._kills = 0;
		this._deaths = 0;
	}

	setKills(kills : number) {
		this._kills = kills;
		this.updateText();
	}

	setDeaths(deaths : number) {
		this._deaths = deaths;
		this.updateText();
	}

	private updateText() : void {
		super.text(this._name + "| " + this._kills + "/" + this._deaths);
	}
}