import { Html } from './html.js'
import { InputMode } from './ui.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'

export class KeyBindingsHandler implements InterfaceHandler {

	private _keyBindingsElm : HTMLElement;

	constructor() {
		this._keyBindingsElm = Html.elm(Html.fieldsetKeyBindings);
	}

	setup() : void {
		this._keyBindingsElm.onclick = (e) => {
			e.stopPropagation();
		};
	}

	reset() : void {

	}

	changeInputMode(mode : InputMode) : void {

	}
}