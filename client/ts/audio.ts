import {Howl} from 'howler';

import { options } from './options.js'

export enum Sound {
	UNKNOWN,
	PEW,
	LASER,
	ROCKET,
	EXPLOSION,

	TOM_SCREAM,
}

export enum SystemSound {
	UNKNOWN,
}

export class Audio {
	private readonly _distThresholdSq : number = 80;

	private _sounds : Map<Sound, Howl>;

	constructor() {
		this._sounds = new Map<Sound, Howl>();
		this.registerSound(Sound.PEW, "./sound/pew.wav");
		this.registerSound(Sound.LASER ,"./sound/laser.wav");
		this.registerSound(Sound.ROCKET, "./sound/rocket.wav");
		this.registerSound(Sound.EXPLOSION, "./sound/explosion.wav");
		this.registerSound(Sound.TOM_SCREAM, "./sound/tom_scream.mp3");
	}

	getSound(sound : Sound) : Howl {
		return this._sounds.get(sound);
	}

	playSystemSound(sound : Sound) : number {
		const howl = this._sounds.get(sound);
		howl.volume(options.soundEffectVolume);
		return howl.play();
	}

	playSound(sound : Sound, dist : THREE.Vector2) : number {
		if (!document.hasFocus()) {
			return -1;
		}

		const howl = this._sounds.get(sound);
		const id = howl.play();
		this.adjustVolume(howl, dist.lengthSq(), id);
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)), id);
		return id;
	}

	playSound3D(sound : Sound, dist : THREE.Vector3) : number {
		if (!document.hasFocus()) {
			return -1;
		}

		const howl = this._sounds.get(sound);
		const id = howl.play();	
		this.adjustVolume(howl, dist.lengthSq(), id);
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		return id;
	}

	adjustSoundDist(sound : Sound, dist : THREE.Vector2, id : number) : void {
		this.adjustVolume(this._sounds.get(sound), dist.lengthSq(), id);
	}

	stopSound(sound : Sound, id : number) : void {
		this._sounds.get(sound).stop(id);
	}

	private adjustVolume(howl : Howl, distSq : number, id : number) {
		if (id < 0) {
			return;
		}

		if (distSq <= this._distThresholdSq) {
			howl.volume(options.soundEffectVolume, id);
		} else {
			howl.volume(options.soundEffectVolume * this._distThresholdSq / distSq, id);
		}
	}

	private registerSound(sound : Sound, srcFile : string) : void {
		this._sounds.set(sound, new Howl({ src: [srcFile]}));
	}
}