import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { Icon } from './icon.js'
import { Util } from './util.js'

export class Client extends HtmlComponent {
	private _name : string;
	private _id : number;

	private _icons : HtmlComponent;
	private _hasVoiceControls : boolean;
	private _voice : HtmlComponent;

	private _kills : HtmlComponent;
	private _deaths : HtmlComponent;

	constructor(id : number, name : string) {
		super(document.createElement("span"));
		this._name = name;
		this._id = id;

		this.textAlign("left");
		this.text(this.displayName());
		this.padding(3);

		this._icons = new HtmlComponent(document.createElement("span"));
		if (this._id === connection.id()) {
			this._icons.appendElm(Icon.person());
		}
		this._icons.appendTo(this);
		this.appendElm(document.createElement("br"));

		this._hasVoiceControls = false;

		this._kills = new HtmlComponent(document.createElement("span"));
		this._deaths = new HtmlComponent(document.createElement("span"));
		this._kills.appendTo(this);
		this._deaths.appendTo(this);
	}

	id() : number { return this._id; }
	name() : string { return this._name; }
	displayName() : string { return this._name + " #" + this._id; }

	// TODO: do this better
	setKills(k : number) : void {
		this._kills.text("K: " + k);
	}
	setDeaths(d : number) : void {
		this._deaths.text("D: " + d);
	}

	enableVoiceControls(stream : MediaStream) : void {
		if (this._hasVoiceControls) {
			return;
		}

		this._voice = new HtmlComponent(document.createElement("audio"));
		let audioElement = <HTMLAudioElement>this._voice.htmlElm();		
		audioElement.autoplay = true;
		audioElement.controls = true;
		audioElement.srcObject = stream;
		this._voice.appendTo(this);

		this._hasVoiceControls = true;
	}
	disableVoiceControls() : void {
		this._hasVoiceControls = false;
		if (Util.defined(this._voice)) {
			this._voice.delete();
		}
	}
}