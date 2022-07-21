import { connection } from './connection.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { InterfaceHandler } from './interface_handler.js'
import { ui, InputMode } from './ui.js'
import { HtmlUtil } from './util.js'

export class LoginHandler implements InterfaceHandler {
	private _loginComponent : HtmlComponent;
	private _gameComponent : HtmlComponent;

	private _enabled : boolean;

	constructor(loginComponent : HtmlComponent, gameComponent : HtmlComponent) {
		this._loginComponent = loginComponent;
		this._gameComponent = gameComponent;

		this._enabled = false;
	}

	setup() : void {
		HtmlUtil.elm(Html.formLogin).onsubmit = () => {
			if (!this._enabled) {
				return;
			}

			const room = HtmlUtil.trimmedValue(Html.inputRoom);
			const name = HtmlUtil.trimmedValue(Html.inputName);
			connection.connect(room, name, () => {}, () => {
				ui.changeInputMode(InputMode.GAME);
			});
		};
	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.LOGIN) {
			this._enabled = true;
			this._loginComponent.displayBlock();

			// TODO: this shouldn't be needed if we move loading text out of login form.
			HtmlUtil.elm(Html.buttonLogin).style.display = "block";
		} else if (mode === InputMode.GAME) {
			this._enabled = false;
			this._loginComponent.displayNone();
			this._gameComponent.displayBlock();
		}
	}
}