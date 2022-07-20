import { HtmlComponent } from './html_component.js'
import { ui, InputMode } from './ui.js'

export class PauseHandler {
	private _pauseComponent : HtmlComponent;

	constructor(component : HtmlComponent) {
		this._pauseComponent = component;
	}

	setup() : void {
		window.addEventListener("blur", () => {
			this.changeInputMode(InputMode.PAUSE);
		});

		this._pauseComponent.elm().onclick = (e : any) => {
			if (ui.inputMode() != InputMode.PAUSE) {
				return;
			}
			this.changeInputMode(InputMode.GAME);
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