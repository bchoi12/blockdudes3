import { HtmlComponent } from './html_component.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ui, InputMode } from './ui.js'

export class PauseHandler implements InterfaceHandler {
	private _pauseComponent : HtmlComponent;

	constructor(component : HtmlComponent) {
		this._pauseComponent = component;
	}

	setup() : void {
		window.addEventListener("blur", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME) {
				return;
			}
			ui.changeInputMode(InputMode.PAUSE);
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode === options.pauseKeyCode) {
				if (ui.inputMode() === InputMode.GAME) {
					ui.changeInputMode(InputMode.PAUSE);
				} else if (ui.inputMode() === InputMode.PAUSE) {
					ui.changeInputMode(InputMode.GAME);
				}
			}
		})

		this._pauseComponent.elm().onclick = (e : any) => {
			if (ui.inputMode() !== InputMode.PAUSE) {
				return;
			}
			ui.changeInputMode(InputMode.GAME);
		}
	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.PAUSE) {
			this._pauseComponent.displayBlock();
		} else {
			this._pauseComponent.displayNone();
		}
	}
}