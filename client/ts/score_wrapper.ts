import { Html, HtmlWrapper } from './html.js'
import { ui } from './ui.js'

export class ScoreWrapper extends HtmlWrapper {
	private _name : string;
	private _kills : number;
	private _deaths : number;

	constructor(id : number) {
		super(Html.div());

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
		this.elm().textContent = this._name + "| " + this._kills + "/" + this._deaths;
	}
}