import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ui, InputMode } from './ui.js'

export class PauseHandler implements InterfaceHandler {
	private _pauseElm : HTMLElement;
	private _continueElm : HTMLElement;

	constructor() {
		this._pauseElm = Html.elm(Html.divPause);
		this._continueElm = Html.elm(Html.pauseContinue);
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

		this._continueElm.onclick = (e : any) => {
			if (ui.inputMode() !== InputMode.PAUSE) {
				return;
			}
			ui.changeInputMode(InputMode.GAME);
		}
	}

	reset() : void {}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.PAUSE) {
			Html.displayBlock(this._pauseElm);
		} else {
			Html.displayNone(this._pauseElm);
		}
	}
}