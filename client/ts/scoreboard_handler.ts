import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ScoreWrapper } from './score_wrapper.js'
import { ui, InputMode } from './ui.js'

export class ScoreboardHandler implements InterfaceHandler {

	private _scoreboardElm : HTMLElement;
	private _scores : Map<number, ScoreWrapper>;

	constructor() {
		this._scoreboardElm = Html.elm(Html.divScoreboard);
		this._scores = new Map<number, ScoreWrapper>();
	}

	setup() : void {
		document.addEventListener("keydown", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME || e.keyCode !== options.scoreboardKeyCode) {
				return;
			}

			this.updateScoreboard();
			Html.displayBlock(this._scoreboardElm);
		});

		document.addEventListener("keyup", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME || e.keyCode !== options.scoreboardKeyCode) {
				return;
			}

			Html.displayNone(this._scoreboardElm);
		});
	}

	changeInputMode(mode : InputMode) : void {}

	private updateScoreboard() : void {
		const players = game.sceneMap().getMap(playerSpace);

		players.forEach((player, id) => {
			if (!this._scores.has(id)) {
				const scoreComponent = new ScoreWrapper(id);
				this._scoreboardElm.append(scoreComponent.elm());
				this._scores.set(id, scoreComponent);
			}

			let score = this._scores.get(id);
			score.setKills(player.kills());
			score.setDeaths(player.deaths());
		});
	}
}