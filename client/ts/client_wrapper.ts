import { connection } from './connection.js'
import { Html, HtmlWrapper } from './html.js'
import { Icon } from './icon.js'
import { Util } from './util.js'

export class ClientWrapper extends HtmlWrapper {
	private _id : number;
	private _name : string;

	private _iconsElm : HTMLElement;
	private _voiceAudioElm : HTMLAudioElement;
	private _hasVoiceControls : boolean;

	constructor(id : number, name : string) {
		super(Html.span());

		this._id = id;
		this._name = name;

		this.elm().textContent = this.displayName();

		this._iconsElm = Html.span();
		if (this._id === connection.id()) {
			this._iconsElm.append(Icon.person());
		}
		this.elm().append(this._iconsElm);
		this.elm().append(Html.br());

		this._hasVoiceControls = false;
	}

	id() : number { return this._id; }
	name() : string { return this._name; }
	displayName() : string { return this._name + " #" + this._id; }

	enableVoiceControls(stream : MediaStream) : void {
		if (this._hasVoiceControls) {
			return;
		}

		this._voiceAudioElm = Html.audio();
		this._voiceAudioElm.autoplay = true;
		this._voiceAudioElm.controls = true;
		this._voiceAudioElm.srcObject = stream;
		this.elm().append(this._voiceAudioElm);

		this._hasVoiceControls = true;
	}

	disableVoiceControls() : void {
		this._hasVoiceControls = false;
		if (Util.defined(this._voiceAudioElm)) {
			this.elm().removeChild(this._voiceAudioElm);
		}
	}
}