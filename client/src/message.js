import { Util } from './util.js';
export class Message {
    constructor() {
        this._extrapolateProps = new Set([posProp, velProp, accProp]);
        this._ignoreExtrapolateProps = new Set([groundedProp, weaponTypeProp, weaponDirProp]);
        this._data = new Map();
        this._seqNum = new Map();
        this._lastUpdate = Date.now();
    }
    update(msg, seqNum) {
        this.sanitizeData(msg);
        const millisElapsed = Date.now() - this._lastUpdate;
        const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;
        for (const [stringProp, data] of Object.entries(msg)) {
            const prop = Number(stringProp);
            if (!Util.defined(seqNum)) {
                if (this._extrapolateProps.has(prop) && this._data.has(prop)) {
                    this._data.set(prop, this.extrapolateVec2(this.get(prop), data, weight));
                }
                else if (!this._ignoreExtrapolateProps.has(prop)) {
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
    extrapolateState(currentData, nextData) {
        const millisElapsed = Date.now() - this._lastUpdate;
        const weight = Math.min(millisElapsed / (frameMillis * 3), 1) * 0.5;
        const data = nextData;
        data[posProp] = this.extrapolateVec2(currentData[posProp], nextData[posProp], weight);
        if (currentData.hasOwnProperty(velProp) && nextData.hasOwnProperty(velProp)) {
            data[velProp] = this.extrapolateVec2(currentData[velProp], nextData[velProp], weight);
        }
        if (currentData.hasOwnProperty(accProp) && nextData.hasOwnProperty(accProp)) {
            data[accProp] = this.extrapolateVec2(currentData[accProp], nextData[accProp], weight);
        }
        return data;
    }
    extrapolateVec2(current, next, weight) {
        const vec = current;
        vec.X = current.X * (1 - weight) + next.X * weight;
        vec.Y = current.Y * (1 - weight) + next.Y * weight;
        return vec;
    }
}
