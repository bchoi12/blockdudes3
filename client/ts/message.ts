import * as THREE from 'three';

import { options } from './options.js'
import { Util } from './util.js'

export class Message {
	private readonly _weightedExtrapolateProps : Set<number> = new Set<number>([posProp, velProp, accProp]);
	private readonly _setProps : Set<number> = new Set<number>([attributesProp /* merge */, keysProp /* overwrite */]);

	private _data : Map<number, any>;
	private _sets : Map<number, Map<number, boolean>>;
	private _seqNum : Map<number, number>;
	private _lastUpdate : number;

	constructor() {
		this._data = new Map<number, any>();
		this._sets = new Map<number, Map<number, boolean>>();
		this._seqNum = new Map<number, number>();
		this._lastUpdate = Date.now();
	}

	update(msg : Map<number, any>, seqNum? : number) {
		this.sanitizeData(msg);

		const millisElapsed = Date.now() - this._lastUpdate;
		const weight = Math.min(millisElapsed / (frameMillis * options.extrapolateFrames), 1) * options.extrapolateWeight;

		for (const [stringProp, data] of Object.entries(msg) as [string, any]) {
			const prop = Number(stringProp);

			if (!Util.defined(seqNum)) {
				if (this._weightedExtrapolateProps.has(prop) && this._data.has(prop)) {
					this._data.set(prop, this.extrapolateVec2(this.get(prop), data, weight));
				} else {
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
		if (prop === attributesProp) {
			return this._sets.get(attributesProp);
		}

		return this._data.get(prop);
	}

	lastUpdate() : number {
		return this._lastUpdate;
	}

	private sanitizeData(data : Map<number, any>) : void {
		if (data.hasOwnProperty(attributesProp)) {
			if (!this._sets.has(attributesProp)) {
				this._sets.set(attributesProp, new Map<number, boolean>());
			}

			let attributes = this._sets.get(attributesProp);
			for (const [stringAttribute, value] of Object.entries(data[attributesProp]) as [string, any]) {
				const attribute = Number(stringAttribute);
				attributes.set(attribute, value);
			}
		}

		this._setProps.forEach((prop) => {
			if (data.hasOwnProperty(prop)) {
				const keys = Object.keys(data[prop]);
				if (keys.length > 0) {
					data[prop] = Util.arrayToString(keys);
				}
			}
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