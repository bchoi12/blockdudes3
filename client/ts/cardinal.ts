
export class Cardinal {
	private _cardinals : number;

	constructor(cardinals : number) {
		this._cardinals = cardinals;
	}

	get(cardinal : number) {
		return ((this._cardinals >> (cardinal - 1)) & 1) === 1;
	}
}