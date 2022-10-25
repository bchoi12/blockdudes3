
import { game } from './game.js'
import { SpacedId } from './spaced_id.js'
import { SpecialNames } from './special_name.js'
import { ui, AnnouncementType } from './ui.js'
import { Util } from './util.js'

export class GameState {
	private readonly _times = new Array<number>(0, 0.2, 0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4, 0.2);

	private _state : number;
	private _teams : Map<number, Array<number>>;
	private _teamScores : Map<number, number>;
	private _vipId : SpacedId;

	constructor() {
		this._state = 0;
		this._teams = new Map<number, Array<number>>();
		this._teamScores = new Map<number, number>();
		this._vipId = SpacedId.invalidId();
	}

	state() : number {
		return this._state;
	}

	teams() : Map<number, Array<number>> {
		return this._teams;
	}

	vipId() : SpacedId {
		return this._vipId;
	}

	update(gameState : Object) : void {
		if (gameState.hasOwnProperty(stateProp)) {
			this._state = gameState[stateProp];
		}
		if (gameState.hasOwnProperty(scoreProp)) {
			this._teamScores = gameState[scoreProp];
		}
		if (gameState.hasOwnProperty(teamsProp)) {
			this._teams = gameState[teamsProp];
		}

		if (gameState.hasOwnProperty(vipProp)) {
			this._vipId = SpacedId.fromMessage(gameState[vipProp]);
		}

		if (this._state === lobbyGameState) {
			game.setTimeOfDay(0);
		}

		if (this._state === activeGameState) {
			game.setTimeOfDay(this._times[(this._teamScores[1] + this._teamScores[2]) % this._times.length]);

			if (this._vipId.valid()) {
				if (this._vipId.id() === game.id()) {
					ui.announce({
						type: AnnouncementType.REACH,
						ttl: 4000,
						names: [SpecialNames.goal()],
					});
				} else {
					const self = game.player();
					const vip = game.player(this._vipId.id());

					if (Util.defined(self) && Util.defined(vip)) {
						if (self.byteAttribute(teamByteAttribute) === vip.byteAttribute(teamByteAttribute)) {
							ui.announce({
								type: AnnouncementType.PROTECT,
								ttl: 4000,
								names: [{
									text: vip.name(),
									color: Util.colorString(vipColor),
								}],
							});
						} else {
							ui.announce({
								type: AnnouncementType.ELIMINATE,
								ttl: 4000,
								names: [SpecialNames.vip()],
							});
						}
					}
				}
			}
		}

		if (this._state === victoryGameState) {
			// TODO: put this variable in the game state message
			game.setUpdateSpeed(0.3);
			ui.announce({
				type: AnnouncementType.SCORE,
				ttl: 3000,
				names: [{
					text: this._teamScores[leftTeam],
				},
				{
					text: this._teamScores[rightTeam],
				}]
			});
		} else {
			game.setUpdateSpeed(1.0);
		}
	}
}