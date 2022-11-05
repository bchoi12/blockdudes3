import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ui, InputMode } from './ui.js'

export class PauseHandler implements InterfaceHandler {
	private _pauseElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canPause : boolean;

	constructor() {
		this._pauseElm = Html.elm(Html.divPause);
		this._continueElm = Html.elm(Html.pauseContinue);

		this._canPause = true;
	}

	setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== options.pauseKeyCode) return;

			this._canPause = true;
		});

		document.addEventListener("keydown", (e : any) => {
			if (!this._canPause || e.keyCode !== options.pauseKeyCode) return;

			this._canPause = false;

			if (ui.inputMode() === InputMode.CHAT) {
				ui.changeInputMode(InputMode.GAME);
			} else if (ui.inputMode() === InputMode.GAME) {
				ui.changeInputMode(InputMode.PAUSE);
			} else if (ui.inputMode() === InputMode.PAUSE) {
				ui.changeInputMode(InputMode.GAME);
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