export class SpacedId {
    constructor(space, id) {
        this._space = space;
        this._id = id;
    }
    space() {
        return this._space;
    }
    id() {
        return this._id;
    }
    valid() {
        return this._space > 0 && this._id >= 0;
    }
    toString() {
        return this._space + "," + this._id;
    }
    parseSpace(sid) {
        return Number(sid.split(",")[0]);
    }
    parseId(sid) {
        return Number(sid.split(",")[1]);
    }
}
