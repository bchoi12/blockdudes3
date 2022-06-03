import { options } from './options.js';
import { Util } from './util.js';
export class Message {
    constructor() {
        this._weightedExtrapolateProps = new Set([posProp, velProp, accProp]);
        this._ignoreExtrapolateProps = new Set([groundedProp, weaponTypeProp]);
        this._data = new Map();
        this._seqNum = new Map();
        this._lastUpdate = Date.now();
    }
    update(msg, seqNum) {
        this.sanitizeData(msg);
        const millisElapsed = Date.now() - this._lastUpdate;
        const weight = Math.min(millisElapsed / (frameMillis * options.extrapolateFrames), 1) * options.extrapolateWeight;
        for (const [stringProp, data] of Object.entries(msg)) {
            const prop = Number(stringProp);
            if (!Util.defined(seqNum)) {
                if (this._ignoreExtrapolateProps.has(prop)) {
                    continue;
                }
                if (this._weightedExtrapolateProps.has(prop) && this._data.has(prop)) {
                    this._data.set(prop, this.extrapolateVec2(this.get(prop), data, weight));
                }
                else {
                    this._data.set(prop, data);
                }
            }
            else if (!this.has(prop) || !this._seqNum.has(prop) || seqNum >= this._seqNum.get(prop)) {
                this._data.set(prop, data);
                this._seqNum.set(prop, seqNum);
            }
        }
    }
    data() {
        return Object.fromEntries(this._data);
    }
    has(prop) {
        return this._data.has(prop);
    }
    get(prop) {
        return this._data.get(prop);
    }
    set(prop, data) {
        this._data.set(prop, data);
    }
    lastUpdate() {
        return this._lastUpdate;
    }
    sanitizeData(data) {
        if (data.hasOwnProperty(keysProp)) {
            const keys = Object.keys(data[keysProp]);
            if (keys.length > 0) {
                data[keysProp] = Util.arrayToString(keys);
            }
        }
    }
    extrapolateVec2(current, next, weight) {
        if ((next.X - current.X) * (next.X - current.X) + (next.Y - current.Y) * (next.Y - current.Y) > 1) {
            return current;
        }
        return {
            X: current.X * (1 - weight) + next.X * weight,
            Y: current.Y * (1 - weight) + next.Y * weight
        };
    }
}
