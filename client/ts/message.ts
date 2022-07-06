import * as THREE from 'three';

import { options } from './options.js'
import { Util } from './util.js'

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
	private readonly _weightedExtrapolateProps : Set<number> = new Set<number>([posProp, velProp, accProp]);
	private readonly _mapProps : Map<number, OverwriteMethod> = new Map<number, OverwriteMethod>([
		[attributesProp, OverwriteMethod.MERGE_AND_REPLACE],
		[keysProp, OverwriteMethod.REPLACE_ALL],
	]);

	private _newData : Map<number, any>;
	private _data : Map<number, any>;
	private _maps : Map<number, Map<number, boolean>>;
	private _seqNum : Map<number, number>;
	private _lastUpdate : number;

	constructor() {
		this._newData = new Map<number, any>();
		this._data = new Map<number, any>();
		this._maps = new Map<number, Map<number, boolean>>();
		this._seqNum = new Map<number, number>();
		this._lastUpdate = Date.now();
	}

	update(msg : Map<number, any>, seqNum? : number) {
		this.sanitizeData(msg);
		this._newData = new Map();

		const millisElapsed = Date.now() - this._lastUpdate;
		const weight = Math.min(millisElapsed / (frameMillis * options.extrapolateFrames), 1) * options.extrapolateWeight;

		for (const [stringProp, data] of Object.entries(msg) as [string, any]) {
			const prop = Number(stringProp);

			if (!Util.defined(seqNum)) {
				if (this._weightedExtrapolateProps.has(prop) && this._data.has(prop)) {
					this._newData.set(prop, this.extrapolateVec2(this.get(prop), data, weight));
				} else {
					this._newData.set(prop, data);
				}
			} else if (!this.has(prop) || !this._seqNum.has(prop) || seqNum >= this._seqNum.get(prop)) {
				this._newData.set(prop, data);
				this._seqNum.set(prop, seqNum);
			}
		}

		for (const [prop, data] of this._newData) {
			this._data.set(prop, data);
		}
	}

	data() : { [k: string]: any } {
		return Object.fromEntries(this._data);
	}

	newData() : { [k: string]: any} {
		return Object.fromEntries(this._newData);
	}

	has(prop : number) : boolean {
		return this._data.has(prop);
	}

	get(prop : number) : any {
		if (this._mapProps.has(prop)) {
			return this._maps.get(prop);
		}

		return this._data.get(prop);
	}

	lastUpdate() : number {
		return this._lastUpdate;
	}

	private sanitizeData(data : Map<number, any>) : void {
		// Maps aren't supported well in WASM so store them separately then convert them to strings for WASM.
		this._mapProps.forEach((overwriteMethod, prop) => {
			if (!data.hasOwnProperty(prop)) {
				return;
			}
			if (overwriteMethod === OverwriteMethod.UNKNOWN) {
				return;
			}

			if (!this._maps.has(prop)) {
				this._maps.set(prop, new Map<number, boolean>());
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
				if (map.get(key) === value) {
					continue;
				}

				edited = true;
				map.set(key, value);
			}

			if (!edited) {
				return;
			}

			let string = "";
			for (const [key, value] of map) {
				string += key + ":" + (value ? "1" : "0") + ",";
			}
			if (string.length > 0) {
				string = string.slice(0, -1);
			}
			data[prop] = string;
		});
	}

	private extrapolateVec2(current : any, next : any, weight : number) : any {
		if ((next.X - current.X) * (next.X - current.X) + (next.Y - current.Y) * (next.Y - current.Y) > 1) {
			return current;
		}
		return {
			X: current.X * (1 - weight) + next.X * weight,
			Y: current.Y * (1 - weight) + next.Y * weight
		};
	}
}