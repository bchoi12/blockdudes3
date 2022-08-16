import { connection } from './connection.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { ui, InputMode } from './ui.js'

export class LoginHandler implements InterfaceHandler {

	private _loginElm : HTMLElement;
	private _gameElm : HTMLElement;

	private _enabled : boolean;

	constructor() {
		this._loginElm = Html.elm(Html.divLogin);
		this._gameElm = Html.elm(Html.divGame);

		this._enabled = false;
	}

	setup() : void {
		Html.elm(Html.formLogin).onsubmit = () => {
			if (!this._enabled) {
				return;
			}

			const room = Html.trimmedValue(Html.inputElm(Html.inputRoom));
			const name = Html.trimmedValue(Html.inputElm(Html.inputName));

			if (room.length === 0 || name.length === 0) {
				return;
			}

			connection.connect(room, name, () => {}, () => {
				ui.changeInputMode(InputMode.GAME);
			});
		};
	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.LOGIN) {
			this._enabled = true;
			Html.displayBlock(this._loginElm);

			// TODO: this shouldn't be needed if we move loading text out of login form.
			Html.elm(Html.buttonLogin).style.display = "block";
		} else if (mode === InputMode.GAME) {
			this._enabled = false;
			Html.displayNone(this._loginElm);
			Html.displayBlock(this._gameElm);
		}
	}
}