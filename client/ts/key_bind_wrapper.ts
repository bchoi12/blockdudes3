
import { Html, HtmlWrapper } from './html.js'
import { Icon } from './icon.js'
import { KeyNames } from './key_names.js'
import { options } from './options.js'
import { ui } from './ui.js'
import { Util } from './util.js'

export class KeyBindWrapper extends HtmlWrapper {
	private _name : string;
	private _active : boolean;
	private _update : (keyCode : number) => void;
	private _getKey : () => number;

	private _nameElm : HTMLElement;
	private _keyElm : HTMLElement;

	constructor(name : string, update : (keyCode : number) => void, getKey : () => number) {
		super(Html.div());

		this.elm().classList.add("text-button");
		this.elm().classList.add("key-binding");

		this._nameElm = Html.div();
		this._nameElm.style.float = "left";
		this._nameElm.textContent = name;

		this.elm().appendChild(this._nameElm);
		this._keyElm = Html.div();
		this._keyElm.style.float = "right";
		this.elm().appendChild(this._keyElm);

		this._update = update;
		this._getKey = getKey;

		this.setActive(false);
		this.elm().onclick = (e) => {
			this.setActive(!this._active);
		};
		document.addEventListener("keydown", (e) => {
			if (!this._active || !Util.defined(e.keyCode)) {
				return;
			}

			this._update(e.keyCode)
			this.setActive(false);
			e.preventDefault();
		});
	}

	setActive(active : boolean) : void {
		if (this._active !== active) {
			this._active = active;
			this.update();
		}
	}

	update() : void {
		if (this._active) {
			this._keyElm.textContent = "[Press a key]";
		} else {
			let key = KeyNames.get(this._getKey());
			this._keyElm.textContent = "[" + key + "]";
		}
	}
}