
export class RingBuffer<T> {

	private _buffer : Array<T>;
	private _index : number;

	constructor() {
		this._index = 0;
		this._buffer = new Array<T>();
	}

	push(t : T) {
		this._buffer.push(t);
	}

	get() : T {
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