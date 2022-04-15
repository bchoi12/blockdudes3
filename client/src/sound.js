import { Howl } from 'howler';
export var Sound;
(function (Sound) {
    Sound[Sound["UNKNOWN"] = 0] = "UNKNOWN";
    Sound[Sound["EXPLOSION"] = 1] = "EXPLOSION";
    Sound[Sound["ROCKET"] = 2] = "ROCKET";
})(Sound || (Sound = {}));
export class Audio {
    constructor() {
        this._sounds.put(SOUND.EXPLOSION, new Howl({ src: ["./sound/test3.wav"] }));
        this._sounds.put();
    }
    playSound(sound) {
    }
}
