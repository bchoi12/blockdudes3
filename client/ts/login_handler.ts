import { connection } from './connection.js'
import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { renderer } from './renderer.js'
import { ui, InputMode } from './ui.js'
import { Util } from './util.js'

export class LoginHandler implements InterfaceHandler {

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;
	private _loginInfoElm : HTMLElement;
	private _roomInputElm : HTMLInputElement;
	private _nameInputElm : HTMLInputElement;
	private _buttonElm : HTMLInputElement;
	private _gameElm : HTMLElement;

	private _room : string;
	private _name : string;

	private _enabled : boolean;
	private _reconnect : boolean;

	constructor() {
		this._loginElm = Html.elm(Html.divLogin);
		this._legendElm = Html.elm(Html.legendLogin);
		this._loginInfoElm = Html.elm(Html.loginInfo);
		this._roomInputElm = Html.inputElm(Html.inputRoom);
		this._nameInputElm = Html.inputElm(Html.inputName);
		this._gameElm = Html.elm(Html.divGame);
		this._buttonElm = Html.inputElm(Html.buttonLogin);

		this._enabled = false;
		this._reconnect = false;
	}

	setup() : void {
		Html.elm(Html.formLogin).onsubmit = () => {
			if (!this._enabled) {
				return;
			}

			const room = Html.trimmedValue(this._roomInputElm);
			const name = Html.trimmedValue(this._nameInputElm);
			if (room.length === 0 || name.length === 0) {
				return;
			}

			let vars = new Map([["room", room], ["name", name]]);
			if (connection.hasId()) {
				vars.set("id", "" + connection.id());
			}

			connection.connect(vars, () => {
				if (this._reconnect) {
					ui.reset();
					game.reset();
					renderer.reset();
				}
			}, () => {
				ui.changeInputMode(InputMode.GAME);

				this._reconnect = true;
				this._room = room;
				this._name = name;
				this._loginInfoElm.textContent = "Lost connection to server"
				this._legendElm.textContent = "Reconnect";
				this._buttonElm.value = "Reconnect";
			});
		};
	}

	reset() : void {}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.LOGIN) {
			this._enabled = true;
			Html.displayBlock(this._loginElm);

			if (Util.defined(this._name)) {
				this._nameInputElm.value = this._name;
				this._nameInputElm.readOnly = true;
			}
			if (Util.defined(this._room)) {
				this._roomInputElm.value = this._room;
				this._roomInputElm.readOnly = true;
			}

			// TODO: this shouldn't be needed if we move loading text out of login form.
			this._buttonElm.style.display = "block";
		} else if (mode === InputMode.GAME) {
			this._enabled = false;
			Html.displayNone(this._loginElm);
			Html.displayBlock(this._gameElm);
		}
	}
}