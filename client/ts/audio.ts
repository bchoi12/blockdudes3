import * as THREE from 'three';

import {Howl} from 'howler';

import { options } from './options.js'
import { RenderObject } from './render_object.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

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

export interface SoundProperties {
	object? : RenderObject;
	pos? : THREE.Vector2|THREE.Vector3;
}

interface CurrentSound {
	sound : Sound;
	howl : Howl;
	id : number;
	properties : SoundProperties;
}

export class Audio {
	private readonly _soundPrefix = "./sound/";
	private readonly _musicPrefix = "./music/";
	private readonly _distThresholdSq : number = 80;

	private _sound : Map<Sound, Howl>;
	private _music : Map<Music, Howl>;
	private _currentSounds : Set<CurrentSound>;

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

		this._currentSounds = new Set<CurrentSound>();
	}

	update() : void {
		for (let currentSound of this._currentSounds) {
			if (!currentSound.howl.playing()) {
				this._currentSounds.delete(currentSound);
				continue;
			}

			if (!this.hasPos(currentSound.properties)) {
				this.stopSound(currentSound.sound, currentSound.id);
				this._currentSounds.delete(currentSound);
				continue;
			}

			this.adjustVolume(currentSound.howl, currentSound.id, this.getPos(currentSound.properties));
		}

	}

	playSound(sound : Sound, properties : SoundProperties) : number {
		if (!document.hasFocus()) {
			return -1;
		}

		const howl = this._sound.get(sound);
		const id = howl.play();
		this.adjustVolume(howl, id, this.getPos(properties));

		this._currentSounds.add({
			sound: sound,
			howl: howl,
			id: id,
			properties: properties,
		});

		return id;
	}

	// TODO: this doesn't seem to work
	fadeoutSound(sound : Sound, id : number) : void {
		const howl = this._sound.get(sound);
		howl.fade(howl.volume(id), 0, 1000 * (howl.duration() - howl.seek()), id);
	}

	stopSound(sound : Sound, id : number) : void {
		this._sound.get(sound).stop(id);
	}

	private distVector(pos : THREE.Vector2|THREE.Vector3) : THREE.Vector2|THREE.Vector3 {
		const anchor = renderer.cameraAnchor();
		if (pos instanceof THREE.Vector2) {
			return new THREE.Vector2(pos.x - anchor.x, pos.y - anchor.y);
		}

		return new THREE.Vector3(pos.x - anchor.x, pos.y - anchor.y, pos.z - anchor.z);
	}

	private hasPos(properties : SoundProperties) : boolean {
		if (properties.object) {
			if (!Util.defined(properties.object)) {
				return false;
			}
			if (!properties.object.hasPos()) {
				return false;
			}
			if (properties.object.deleted()) {
				return false;
			}

			return true;
		}

		if (properties.pos) {
			return true;
		}
		return false;
	}

	private getPos(properties : SoundProperties) : THREE.Vector3 {
		if (Util.defined(properties.object)) {
			return properties.object.pos3();
		}

		if (properties.pos instanceof THREE.Vector2) {
			return new THREE.Vector3(properties.pos.x, properties.pos.y, 0);
		}

		if (properties.pos instanceof THREE.Vector3) {
			return properties.pos.clone();
		}

		return renderer.cameraAnchor();
	}

	private adjustVolume(howl : Howl, id : number, pos : THREE.Vector2|THREE.Vector3) {
		if (id < 0) {
			return;
		}

		const dist = this.distVector(pos);
		if (dist.lengthSq() <= this._distThresholdSq) {
			howl.volume(options.soundVolume, id);
		} else {
			howl.volume(options.soundVolume * this._distThresholdSq / dist.lengthSq(), id);
		}
		howl.stereo(Math.min(1, Math.max(-1, dist.x / 10)), id);
	}

	private registerSound(sound : Sound, srcFile : string) : void {
		this._sound.set(sound, new Howl({ src: [srcFile]}));
	}

	private registerMusic(music : Music, srcFile : string) : void {
		this._music.set(music, new Howl({src: [srcFile]}));
	}
}