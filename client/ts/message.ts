import * as THREE from 'three';

import { Util } from './util.js'

export class Message {
	private readonly _interpolateProps : Set<number> = new Set<number>([posProp, velProp, accProp]);
	private readonly _ignoreInterpolateProps : Set<number> = new Set<number>([groundedProp]);

	private _data : Map<number, any>;
	private _seqNum : Map<number, number>;
	private _lastUpdate : number;

	constructor() {
		this._data = new Map<number, any>();
		this._seqNum = new Map<number, number>();
		this._lastUpdate = Date.now();
	}

	update(msg : Map<number, any>, seqNum? : number) {
		this.sanitizeData(msg);

		const millisElapsed = Date.now() - this._lastUpdate;
		const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;

		for (const [stringProp, data] of Object.entries(msg) as [string, any]) {
			const prop = Number(stringProp);

			if (!Util.defined(seqNum)) {
				if (this._interpolateProps.has(prop) && this._data.has(prop)) {
					this._data.set(prop, this.interpolateVec2(this.get(prop), data, weight));
				} else if (!this._ignoreInterpolateProps.has(prop)) {
					this._data.set(prop, data);
				}
			} else if (!this.has(prop) || !this._seqNum.has(prop) || seqNum >= this._seqNum.get(prop)) {
				this._data.set(prop, data);
				this._seqNum.set(prop, seqNum);
			}
		}
	}

	data() : { [k: string]: any } {
		return Object.fromEntries(this._data);
	}

	has(prop : number) : boolean {
		return this._data.has(prop);
	}

	get(prop : number) : any {
		return this._data.get(prop);
	}

	set(prop : number, data : any) : void {
		this._data.set(prop, data);
	}

	lastUpdate() : number {
		return this._lastUpdate;
	}

	private sanitizeData(data : Map<number, any>) : void {
		if (data.hasOwnProperty(keysProp)) {
			const keys = Object.keys(data[keysProp]);
			if (keys.length > 0) {
				data[keysProp] = Util.arrayToString(keys);
			}
		}
	}

	private interpolateState(currentData : any, nextData : any) : any {
		const millisElapsed = Date.now() - this._lastUpdate;
		const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;

		const data = nextData;
		data[posProp] = this.interpolateVec2(currentData[posProp], nextData[posProp], weight);
		if (currentData.hasOwnProperty(velProp) && nextData.hasOwnProperty(velProp)) {
			data[velProp] = this.interpolateVec2(currentData[velProp], nextData[velProp], weight);
		}
		if (currentData.hasOwnProperty(accProp) && nextData.hasOwnProperty(accProp)) {
			data[accProp] = this.interpolateVec2(currentData[accProp], nextData[accProp], weight);
		}
		return data;
	}

	private interpolateVec2(current : any, next : any, weight : number) : any {
		const vec = current;
		vec.X = current.X * (1 - weight) + next.X * weight;
		vec.Y = current.Y * (1 - weight) + next.Y * weight;
		return vec;
	}
}