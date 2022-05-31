import { connection } from './connection.js';
import { HtmlComponent } from './html_component.js';
import { Icon } from './icon.js';
import { Util } from './util.js';
export class Client extends HtmlComponent {
    constructor(id, name) {
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
    }
    id() { return this._id; }
    name() { return this._name; }
    displayName() { return this._name + " #" + this._id; }
    enableVoiceControls(stream) {
        if (this._hasVoiceControls) {
            return;
        }
        this._voice = new HtmlComponent(document.createElement("audio"));
        let audioElement = this._voice.htmlElm();
        audioElement.autoplay = true;
        audioElement.controls = true;
        audioElement.srcObject = stream;
        this._voice.appendTo(this);
        this._hasVoiceControls = true;
    }
    disableVoiceControls() {
        this._hasVoiceControls = false;
        if (Util.defined(this._voice)) {
            this._voice.delete();
        }
    }
}
