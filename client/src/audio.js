import { Howl } from 'howler';
export var Sound;
(function (Sound) {
    Sound[Sound["UNKNOWN"] = 0] = "UNKNOWN";
    Sound[Sound["EXPLOSION"] = 1] = "EXPLOSION";
    Sound[Sound["ROCKET"] = 2] = "ROCKET";
})(Sound || (Sound = {}));
export class Audio {
    constructor() {
        this._sounds = new Map();
        this._sounds.set(Sound.EXPLOSION, new Howl({ src: ["./sound/test3.wav"] }));
        this._sounds.set(Sound.ROCKET, new Howl({ src: ["./sound/test2.wav"] }));
    }
    playSystemSound(sound) {
        const howl = this._sounds.get(sound);
        howl.volume(1);
        howl.play();
    }
    playSound(sound, dist) {
        const howl = this._sounds.get(sound);
        if (dist.lengthSq() <= 50) {
            howl.volume(1);
        }
        else {
            howl.volume(50 / dist.lengthSq());
        }
        howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
        howl.play();
    }
    playSound3D(sound, dist) {
        const howl = this._sounds.get(sound);
        if (dist.lengthSq() <= 50) {
            howl.volume(1);
        }
        else {
            howl.volume(50 / dist.lengthSq());
        }
        howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
        howl.play();
    }
}
