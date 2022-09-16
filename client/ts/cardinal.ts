
export class Cardinal {
	static readonly names = [
		"left",
		"right",
		"bottom",
		"top",
		"bottomleft",
		"bottomright",
		"topleft",
		"topright",
	]

	private _cardinals : number;
	private _nameToCardinal : Map<string, number>;

	constructor(cardinals : number) {
		this._cardinals = cardinals;

		 this._nameToCardinal = new Map<string, number>([
			["left", leftCardinal],
			["right", rightCardinal],
			["bottom", bottomCardinal],
			["top", topCardinal],
			["bottomleft", bottomLeftCardinal],
			["bottomright", bottomRightCardinal],
			["topleft", topLeftCardinal],
			["topright", topRightCardinal],
		]);
	}

	get(cardinal : number) : boolean {
		return ((this._cardinals >> (cardinal - 1)) & 1) === 1;
	}

	getCardinals(names : Set<string>) : Array<number> {
		let cardinals = new Array<number>();
		names.forEach((name) => {
			if (this._nameToCardinal.has(name) && this.get(this._nameToCardinal.get(name))) {
				cardinals.push(this._nameToCardinal.get(name));
			}
		});
		return cardinals;
	}

	anyLeft() {
		return this.get(leftCardinal) || this.get(topLeftCardinal) || this.get(bottomLeftCardinal);
	}

	anyRight() {
		return this.get(rightCardinal) || this.get(topRightCardinal) || this.get(bottomRightCardinal);
	}
}