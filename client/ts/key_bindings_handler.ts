import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { KeyBindWrapper } from './key_bind_wrapper.js'
import { options } from './options.js'
import { ui, InputMode } from './ui.js'

export class KeyBindingsHandler implements InterfaceHandler {

	private _keyBindingsElm : HTMLElement;
	private _keyBindWrappers : Array<KeyBindWrapper>;

	constructor() {
		this._keyBindingsElm = Html.elm(Html.fieldsetKeyBindings);
		this._keyBindWrappers = new Array<KeyBindWrapper>();

		this.addKeyBind(
			"Move left",
			(keyCode : number) => { options.leftKeyCode = keyCode; },
			() => { return options.leftKeyCode });
		this.addKeyBind(
			"Move right",
			(keyCode : number) => { options.rightKeyCode = keyCode; },
			() => { return options.rightKeyCode });
		this.addKeyBind(
			"Jump / double jump",
			(keyCode : number) => { options.jumpKeyCode = keyCode; },
			() => { return options.jumpKeyCode });
		this.addKeyBind(
			"Pickup / equip",
			(keyCode : number) => { options.interactKeyCode = keyCode; },
			() => { return options.interactKeyCode });
		this.addKeyBind(
			"Use equip",
			(keyCode : number) => { options.altMouseClickKeyCode = keyCode; },
			() => { return options.altMouseClickKeyCode });

		this._keyBindingsElm.appendChild(Html.br());

		this.addKeyBind(
			"Pause",
			(keyCode : number) => { options.pauseKeyCode = keyCode; },
			() => { return options.pauseKeyCode });
		this.addKeyBind(
			"Chat",
			(keyCode : number) => { options.chatKeyCode = keyCode; },
			() => { return options.chatKeyCode });
		this.addKeyBind(
			"Show scoreboard",
			(keyCode : number) => { options.scoreboardKeyCode = keyCode; },
			() => { return options.scoreboardKeyCode });
	}

	setup() : void {
		this._keyBindingsElm.onclick = (e) => {
			e.stopPropagation();
		};
	}

	reset() : void {

	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.PAUSE) {
			this._keyBindWrappers.forEach((wrapper) => {
				wrapper.setActive(false);
			})
		}
	}

	private addKeyBind(name : string, update : (keyCode : number) => void, getKey : () => number) : void {
		let binding = new KeyBindWrapper(name, (keyCode : number) => {
			update(keyCode);
			ui.updateKeyBindings();
		}, getKey);
		this._keyBindingsElm.append(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}