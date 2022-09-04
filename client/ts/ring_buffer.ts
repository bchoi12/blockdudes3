
import { Util } from './util.js'

export class RingBuffer<T> {

	private _buffer : Array<T>;
	private _index : number;
	private _shuffle : boolean;

	constructor(array : Array<T>) {
		this._index = 0;
		this._buffer = array;
		this._shuffle = false;
	}

	setShuffle(shuffle : boolean) {
		this._shuffle = shuffle;
	}

	asArray() : Array<T> {
		return this._buffer;
	}

	push(t : T) {
		this._buffer.push(t);
	}

	getNext() : T {
		if (this._buffer.length === 0) {
			return null;
		}
		if (this._index >= this._buffer.length) {
			this._index = 0;
		}
		if (this._index === 0 && this._shuffle) {
			Util.shuffleArray(this._buffer);
		}

		let next = this._buffer[this._index];
		this._index++;
		return next;
	}
}