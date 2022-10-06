
import { Util } from './util.js'

export class ChangeTracker<T> {

	private _getValue : () => T;

	private _value : T;
	private _onChange : (value? : T, oldValue? : T) => void;

	constructor(getValue : () => T, onChange? : (value? : T, oldValue? : T) => void) {
		this._getValue = getValue;
		if (Util.defined(onChange)) {
			this._onChange = onChange;
		}
	}

	check() : void {
		const value = this._getValue();
		if (!Util.defined(this._value)) {
			this._value = value;
			return;
		}

		if (this._value !== value) {
			if (Util.defined(this._onChange)) {
				this._onChange(value, this._value);
			}
			this._value = value;
		}
	}

	set(value : T) {
		this._value = value;
	}

	value() : T {
		return this._value;
	}
}

export class PerSecondTracker {
	private _value : number;
	private _lastFlush : number;

	constructor() {
		this.reset();
	}

	reset() : void {
		this._value = 0;
		this._lastFlush = Date.now();
	}

	add(value : number) : void {
		this._value += value;
	}

	flush() : number {
		let temp = this._value / this.secondsElapsed();
		this.reset();
		return temp;
	}

	secondsElapsed() : number {
		return (Date.now() - this._lastFlush) / 1000;
	}
}