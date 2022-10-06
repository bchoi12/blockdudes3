import {Howl} from 'howler';

import { options } from './options.js'

export enum Sound {
	UNKNOWN,
	PEW,
	BIT_PEW,
	LASER,
	ROCKET,
	THROW,
	EXPLOSION,
	TOM_SCREAM,
}

export enum Music {
	UNKNOWN,
	PIANO,
}

export enum SystemSound {
	UNKNOWN,
}

export class Audio {
	private readonly _soundPrefix = "./sound/";
	private readonly _musicPrefix = "./music/";
	private readonly _distThresholdSq : number = 80;

	private _sound : Map<Sound, Howl>;
	private _music : Map<Music, Howl>;

	constructor() {
		this._sound = new Map<Sound, Howl>();
		this.registerSound(Sound.PEW, this._soundPrefix + "pew.wav");
		this.registerSound(Sound.BIT_PEW, this._soundPrefix + "bitpew.wav");
		this.registerSound(Sound.LASER , this._soundPrefix + "laser.wav");
		this.registerSound(Sound.ROCKET, this._soundPrefix + "rocket.wav");
		this.registerSound(Sound.THROW, this._soundPrefix + "throw.wav");
		this.registerSound(Sound.EXPLOSION, this._soundPrefix + "explosion.wav");
		this.registerSound(Sound.TOM_SCREAM, this._soundPrefix + "tom_scream.mp3");

		this._music = new Map<Music, Howl>();
		this.registerMusic(Music.PIANO, this._musicPrefix + "piano.mp3");
	}

	getSound(sound : Sound) : Howl {
		return this._sound.get(sound);
	}

	playSystemSound(sound : Sound) : number {
		const howl = this._sound.get(sound);
		howl.volume(options.soundVolume);
		return howl.play();
	}

	playSound(sound : Sound, dist : THREE.Vector2) : number {
		if (!document.hasFocus()) {
			return -1;
		}

		const howl = this._sound.get(sound);
		const id = howl.play();
		this.adjustVolume(howl, dist.lengthSq(), id);
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)), id);
		return id;
	}

	playSound3D(sound : Sound, dist : THREE.Vector3) : number {
		if (!document.hasFocus()) {
			return -1;
		}

		const howl = this._sound.get(sound);
		const id = howl.play();	
		this.adjustVolume(howl, dist.lengthSq(), id);
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)));
		return id;
	}

	adjustSoundDist(sound : Sound, dist : THREE.Vector2, id : number) : void {
		this.adjustVolume(this._sound.get(sound), dist.lengthSq(), id);
	}

	fadeoutSound(sound : Sound, id : number) : void {
		const howl = this._sound.get(sound);
		howl.fade(howl.volume(id), 0, 1000 * (howl.duration() - howl.seek()), id);
	}

	stopSound(sound : Sound, id : number) : void {
		this._sound.get(sound).stop(id);
	}

	private adjustVolume(howl : Howl, distSq : number, id : number) {
		if (id < 0) {
			return;
		}

		if (distSq <= this._distThresholdSq) {
			howl.volume(options.soundVolume, id);
		} else {
			howl.volume(options.soundVolume * this._distThresholdSq / distSq, id);
		}
	}

	private registerSound(sound : Sound, srcFile : string) : void {
		this._sound.set(sound, new Howl({ src: [srcFile]}));
	}

	private registerMusic(music : Music, srcFile : string) : void {
		this._music.set(music, new Howl({src: [srcFile]}));
	}
}