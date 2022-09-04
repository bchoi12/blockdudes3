import * as THREE from 'three';

import { options } from './options.js'
import { LogUtil, Util } from './util.js'

enum OverwriteMethod {
	UNKNOWN = 0,
	// Clear then replace all data.
	REPLACE_ALL = 1,
	// Merge new data, replace existing data.
	MERGE_AND_REPLACE = 2,
	// Merge new data, skip existing data.
	MERGE_AND_SKIP = 3,
}

export class Message {
	private readonly _extrapolateProps : Set<number> = new Set<number>([posProp, velProp, accProp]);
	private readonly _mapProps : Map<number, OverwriteMethod> = new Map<number, OverwriteMethod>([
		[attributesProp, OverwriteMethod.MERGE_AND_REPLACE],
		[byteAttributesProp, OverwriteMethod.MERGE_AND_REPLACE],
		[intAttributesProp, OverwriteMethod.MERGE_AND_REPLACE],
		[floatAttributesProp, OverwriteMethod.MERGE_AND_REPLACE],
		[keysProp, OverwriteMethod.REPLACE_ALL],
	]);

	private _data : Map<number, any>;
	private _maps : Map<number, Map<number, number>>;
	private _seqNum : Map<number, number>;
	private _lastSeqNum : number;
	private _lastUpdate : number;

	constructor() {
		this._data = new Map<number, any>();
		this._maps = new Map<number, Map<number, number>>();
		this._seqNum = new Map<number, number>();
		this._lastSeqNum = 0;
		this._lastUpdate = Date.now();
	}

	setData(msg : { [k: string]: any }, seqNum? : number) {
		if (!Util.defined(msg)) {
			LogUtil.d("Null msg!");
			return;
		}

		if (Util.defined(seqNum)) {
			this._lastSeqNum = Math.max(seqNum, this._lastSeqNum);
		}

		this.sanitizeData(msg);

		const millisElapsed = Date.now() - this._lastUpdate;
		const weight = Math.min(millisElapsed / (options.extrapolateMs), 1) * options.extrapolateWeight;

		for (const [stringProp, data] of Object.entries(msg) as [string, any]) {
			const prop = Number(stringProp);

			if (!Util.defined(seqNum)) {
				if (this._extrapolateProps.has(prop) && this._data.has(prop)) {
					this._data.set(prop, this.extrapolateVec2(prop, data, weight));
				} else {
					this._data.set(prop, data);
				}
			} else if (!this.has(prop) || !this._seqNum.has(prop) || seqNum >= this._seqNum.get(prop)) {
				this._data.set(prop, data);
				this._seqNum.set(prop, seqNum);
			}
		}
	}

	dataDEBUG() : any { return this._data; }
	data() : { [k: string]: any } { return Object.fromEntries(this._data); }
	has(prop : number) : boolean { return this._data.has(prop); }
	lastSeqNum() : number { return this._lastSeqNum; }
	lastUpdate() : number { return this._lastUpdate; }

	get(prop : number) : any {
		if (this._mapProps.has(prop)) {
			return this._maps.get(prop);
		}

		return this._data.get(prop);
	}

	getOr(prop : number, or : any) : any {
		if (this._mapProps.has(prop)) {
			return this._maps.get(prop);
		}
		if (this._data.has(prop)) {
			return this._data.get(prop);
		}
		return or;
	}

	private sanitizeData(data : Object) : void {
		// Maps aren't supported well in WASM so store them separately then convert them to strings for WASM.
		this._mapProps.forEach((overwriteMethod, prop) => {
			if (!data.hasOwnProperty(prop)) {
				return;
			}
			if (overwriteMethod === OverwriteMethod.UNKNOWN) {
				return;
			}

			if (!this._maps.has(prop)) {
				this._maps.set(prop, new Map<number, number>());
			}

			let map = this._maps.get(prop);
			let edited = false;
			if (overwriteMethod === OverwriteMethod.REPLACE_ALL && map.size > 0) {
				edited = true;
				map.clear();
			}

			for (const [stringKey, value] of Object.entries(data[prop]) as [string, any]) {
				const key = Number(stringKey);
				if (overwriteMethod === OverwriteMethod.MERGE_AND_SKIP && map.has(key)) {
					continue;
				}
				
				let num = value;
				if (typeof value == 'boolean') {
					num = value ? 1 : 0;
				}

				if (map.has(key) && map.get(key) === num) {
					continue;
				}

				edited = true;
				map.set(key, num);
			}

			if (!edited) {
				return;
			}

			let string = "";
			for (const [key, value] of map) {
				string += key + ":" + value + ",";
			}
			if (string.length > 0) {
				string = string.slice(0, -1);
			}
			data[prop] = string;
		});
	}

	private extrapolateVec2(prop : number, next : any, weight : number) : any {
		let current = this.get(prop);

		if (prop === posProp) {
			const diff = Math.abs(current.X - next.X) + Math.abs(current.Y - next.Y);
			if (diff > 0.8) {
				return current;
			}
		}

		if (weight > 1) {
			return next;
		}
		return {
			X: current.X * (1 - weight) + next.X * weight,
			Y: current.Y * (1 - weight) + next.Y * weight,
		};
	}
}