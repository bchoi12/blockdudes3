import { game } from './game.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ScoreComponent } from './score_component.js'
import { ui, InputMode } from './ui.js'
import { HtmlUtil } from './util.js'

export class ScoreboardHandler implements InterfaceHandler {

	private _scoreboardComponent : HtmlComponent;
	private _scores : Map<number, ScoreComponent>;

	constructor(component : HtmlComponent) {
		this._scoreboardComponent = component;
		this._scores = new Map<number, ScoreComponent>();
	}

	setup() : void {
		document.addEventListener("keydown", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME || e.keyCode !== options.scoreboardKeyCode) {
				return;
			}

			this.updateScoreboard();
			this._scoreboardComponent.displayBlock();
		});

		document.addEventListener("keyup", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME || e.keyCode !== options.scoreboardKeyCode) {
				return;
			}

			this._scoreboardComponent.displayNone();
		});
	}

	changeInputMode(mode : InputMode) : void {}

	private updateScoreboard() : void {
		const players = game.sceneMap().getMap(playerSpace);

		players.forEach((player, id) => {
			if (!this._scores.has(id)) {
				const scoreDiv = document.createElement("div");
				const scoreComponent = new ScoreComponent(id, scoreDiv);
				scoreComponent.appendTo(this._scoreboardComponent);
				this._scores.set(id, scoreComponent);
			}

			let score = this._scores.get(id);
			score.setKills(player.kills());
			score.setDeaths(player.deaths());
		});
	}
}