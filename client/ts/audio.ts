import {Howl} from 'howler';

// TODO: put system sounds in separate enum
export enum Sound {
	UNKNOWN,
	PEW,
	ROCKET,
	EXPLOSION,
}

export class Audio {

	private _sounds : Map<Sound, Howl>;

	constructor() {
		this._sounds = new Map<Sound, Howl>();
		this.registerSound(Sound.PEW, "./sound/test.wav");
		this.registerSound(Sound.ROCKET, "./sound/test2.wav");
		this.registerSound(Sound.EXPLOSION, "./sound/test3.wav");
	}

	playSystemSound(sound : Sound) : void {
		const howl = this._sounds.get(sound);
		howl.volume(1);
		howl.play();
	}

	playSound(sound : Sound, dist : THREE.Vector2) : void {
		if (!document.hasFocus()) {
			return;
		}

		const howl = this._sounds.get(sound);

		const id = howl.play();
		if (dist.lengthSq() <= 50) {
			howl.volume(1, id);
		} else {
			howl.volume(50 / dist.lengthSq(), id);
		}
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)), id);
	}

	playSound3D(sound : Sound, dist : THREE.Vector3) : void {
		if (!document.hasFocus()) {
			return;
		}

		const howl = this._sounds.get(sound);
		if (dist.lengthSq() <= 50) {
			howl.volume(1);
		} else {
			howl.volume(50 / dist.lengthSq());
		}
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		howl.play();	
	}

	private registerSound(sound : Sound, srcFile : string) : void {
		this._sounds.set(sound, new Howl({ src: [srcFile]}));
	}
}