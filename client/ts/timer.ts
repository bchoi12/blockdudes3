
import { Util } from './util.js'

export class Timer {

	private _enabled : boolean;
	private _started : number;

	private _hasDuration : boolean;
	private _duration : number;

	constructor(duration? : number) {
		this._enabled = false;
		this._started = 0;

		if (Util.defined(duration)) {
			this._duration = duration;
			this._hasDuration = true;
		} else {
			this._hasDuration = false;
		}
	}

	start() : void {
		this._started = Date.now();
		this._enabled = true;
	}

	stop() : void {
		this._enabled = false;
	}

	enabled() : boolean {
		return this._enabled;
	}

	timeElapsed() : number {
		if (!this._enabled) {
			return 0;
		}

		return Date.now() - this._started;
	}

	weight() : number {
		if (!this._enabled || !this._hasDuration) {
			return 0;
		}

		return Math.min(1, (Date.now() - this._started) / this._duration);
	}
}