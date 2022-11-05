import { Html } from './html.js'
import { InputMode } from './ui.js'
import { InterfaceHandler } from './interface_handler.js'
import { OptionWrapper } from './option_wrapper.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { Util } from './util.js'

export class OptionsHandler implements InterfaceHandler {

	private _optionsElm : HTMLElement;

	constructor() {
		this._optionsElm = Html.elm(Html.fieldsetOptions);
	}

	setup() : void {
		this._optionsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let fullscreen = new OptionWrapper({
			id: "input-fullscreen",
			type: "checkbox",
			label: "Enable fullscreen",

			getOption: () => {
				return options.enableFullscreen;
			},
			setOption: (value: boolean) => {
				options.enableFullscreen = value;
			},
		});
		this._optionsElm.appendChild(fullscreen.elm());

		let pointerLock = new OptionWrapper({
			id: "input-pointer-lock",
			type: "checkbox",
			label: "Enable in-game cursor",

			getOption: () => {
				return options.enablePointerLock;
			},
			setOption: (value : boolean) => {
				options.enablePointerLock = value;
			},
		});
		this._optionsElm.appendChild(pointerLock.elm());

		let shadows = new OptionWrapper({
			id: "input-shadows",
			type: "checkbox",
			label: "Enable shadows",

			getOption: () => {
				return options.enableShadows;
			},
			setOption: (value : boolean) => {
				options.enableShadows = value;
				renderer.reset();
			},
		});
		this._optionsElm.appendChild(shadows.elm());

		let effects = new OptionWrapper({
			id: "input-effects",
			type: "checkbox",
			label: "Enable special effects",

			getOption: () => {
				return options.enableEffects;
			},
			setOption: (value : boolean) => {
				options.enableEffects = value;
			},
		});
		this._optionsElm.appendChild(effects.elm());

		let antiAliasing = new OptionWrapper({
			id: "input-anti-aliasing",
			type: "checkbox",
			label: "Enable anti-aliasing",

			getOption: () => {
				return options.enableAntialiasing;
			},
			setOption: (value : boolean) => {
				options.enableAntialiasing = value;
			},
		});
		this._optionsElm.appendChild(antiAliasing.elm());

		let extrapolation = new OptionWrapper({
			id: "input-extrapolation",
			type: "range",
			label: "Client-side prediction",

			min: 0,
			max: 1,
			step: 0.01,

			getOption: () => {
				return options.extrapolateWeight;
			},
			setOption: (value : number) => {
				options.extrapolateWeight = value;
			},
		});
		this._optionsElm.appendChild(extrapolation.elm());

		let soundVolume = new OptionWrapper({
			id: "input-sound-volume",
			type: "range",
			label: "Sound volume",

			min: 0,
			max: 1,
			step: 0.01,

			getOption: () => {
				return options.soundVolume;
			},
			setOption: (value : number) => {
				options.soundVolume = value;
			},
		});
		this._optionsElm.appendChild(soundVolume.elm());

		let resolution = new OptionWrapper({
			id: "input-resolution",
			type: "range",
			label: "Resolution",

			min: 0.6,
			max: 1,
			step: 0.01,

			getOption: () => {
				return options.resolution;
			},
			setOption: (value : number) => {
				options.resolution = value;
				renderer.resize();
			},
		});
		this._optionsElm.appendChild(resolution.elm());
	}

	reset() : void {}

	changeInputMode(mode : InputMode) : void {
		if (mode !== InputMode.PAUSE) {
			if (options.enableFullscreen) {
				let elm = document.documentElement;
				elm.requestFullscreen();
			} else {
				document.exitFullscreen();
			}
		}
	}
}