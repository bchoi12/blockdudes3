
export class Interp {
	private _min : number;
	private _max : number;
	private _len : number;

	private _capMin : boolean;
	private _capMax : boolean;

	// should usually go from (0, 0) to (1, 1)
	private _fn : (x : number) => number;

	constructor(min : number, max : number) {
		this._min = min;
		this._max = max;
		this._len = max - min;

		this._capMin = false;
		this._capMax = false;

		this._fn = (x) => { return x; }
	}

	setFn(fn : (x : number) => number) : void {
		this._fn = fn;
	}

	get(x : number) : number {
		if (this._capMax) {
			x = Math.min(x, this._max);
		}
		if (this._capMin) {
			x = Math.max(x, this._min);
		}

		return this._min + this._fn(x) * this._len;
	}

	capMax(cap : boolean) : void {
		this._capMax = cap;
	}

	capMin(cap : boolean) : void {
		this._capMin = cap;
	}
}