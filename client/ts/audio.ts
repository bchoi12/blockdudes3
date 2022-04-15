import {Howl} from 'howler';

// TODO: put system sounds in separate enum
export enum Sound {
	UNKNOWN,
	EXPLOSION,
	ROCKET,
}

export class Audio {

	private _sounds : Map<Sound, Howl>;

	constructor() {
		this._sounds = new Map<Sound, Howl>();
		this._sounds.set(Sound.EXPLOSION, new Howl({ src: ["./sound/test3.wav"] }));
		this._sounds.set(Sound.ROCKET, new Howl({ src: ["./sound/test2.wav"] }));
	}

	playSystemSound(sound : Sound) : void {
		const howl = this._sounds.get(sound);
		howl.volume(1);
		howl.play();
	}

	playSound(sound : Sound, dist : THREE.Vector2) : void {
		const howl = this._sounds.get(sound);
		if (dist.lengthSq() <= 50) {
			howl.volume(1);
		} else {
			howl.volume(50 / dist.lengthSq());
		}
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		howl.play();
	}

	playSound3D(sound : Sound, dist : THREE.Vector3) : void {
		const howl = this._sounds.get(sound);
		if (dist.lengthSq() <= 50) {
			howl.volume(1);
		} else {
			howl.volume(50 / dist.lengthSq());
		}
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		howl.play();	
	}
}