import { connection } from './connection.js'
import { Html, HtmlWrapper } from './html.js'
import { Icon } from './icon.js'
import { ui } from './ui.js'
import { Util } from './util.js'
import { VoiceWrapper } from './voice_wrapper.js'

export class ClientWrapper extends HtmlWrapper {
	private _id : number;
	private _name : string;
	private _voiceWrapper : VoiceWrapper;

	constructor(id : number, name : string) {
		super(Html.div());

		this._id = id;
		this._name = name;

		this.elm().textContent = this.displayName();

		this._voiceWrapper = new VoiceWrapper(id);
		this.elm().append(this._voiceWrapper.elm());
	}

	id() : number { return this._id; }
	name() : string { return this._name; }
	displayName() : string { return this._name + " #" + this._id; }

	enableVoiceControls(stream : MediaStream) : void {
		this._voiceWrapper.enable(stream);
	}

	disableVoiceControls() : void {
		this._voiceWrapper.disable();
	}
}