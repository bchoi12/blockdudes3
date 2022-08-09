
export class RingBuffer<T> {

	private _buffer : Array<T>;
	private _index : number;

	constructor() {
		this._index = 0;
		this._buffer = new Array<T>();
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

		let next = this._buffer[this._index];
		this._index++;
		return next;
	}
}