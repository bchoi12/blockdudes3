
export class Cardinal {
	private _cardinals : number;

	constructor(cardinals : number) {
		this._cardinals = cardinals;
	}

	get(cardinal : number) {
		return ((this._cardinals >> (cardinal - 1)) & 1) === 1;
	}

	anyLeft() {
		return this.get(leftCardinal) || this.get(topLeftCardinal) || this.get(bottomLeftCardinal);
	}

	anyRight() {
		return this.get(rightCardinal) || this.get(topRightCardinal) || this.get(bottomRightCardinal);
	}
}