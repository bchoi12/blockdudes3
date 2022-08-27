

export class Range {
	private _min : number;
	private _max : number;

	constructor(min : number, max : number) {
		this._min = min;
		this._max = max;
	}

	lerp(percent : number) {
		return this._min + percent * (this._max - this._min);
	}

	random() {
		return this.lerp(Math.random());
	}
}