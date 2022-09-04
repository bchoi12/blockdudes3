import { Html } from './html.js'
import { InputMode } from './ui.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { renderer } from './renderer.js'

export class OptionsHandler implements InterfaceHandler {

	private _optionsElm : HTMLElement;

	private _pointerLockInputElm : HTMLInputElement;
	private _shadowsInputElm : HTMLInputElement;
	private _effectsInputElm : HTMLInputElement;
	private _antialiasingElm : HTMLElement;
	private _antialiasingInputElm : HTMLInputElement;

	private _extrapolationInputElm : HTMLInputElement;
	private _soundVolumeInputElm : HTMLInputElement;
	private _rendererScaleInputElm : HTMLInputElement;
	private _multisamplingElm : HTMLElement;
	private _multisamplingInputElm : HTMLInputElement;

	constructor() {
		this._optionsElm = Html.elm(Html.fieldsetOptions);

		this._pointerLockInputElm = Html.inputElm(Html.inputPointerLock);
		this._shadowsInputElm = Html.inputElm(Html.inputShadows);
		this._effectsInputElm = Html.inputElm(Html.inputEffects);
		this._antialiasingElm = Html.elm(Html.optionsAntialiasing);
		this._antialiasingInputElm = Html.inputElm(Html.inputAntialiasing);

		this._extrapolationInputElm = Html.inputElm(Html.inputExtrapolation);
		this._soundVolumeInputElm = Html.inputElm(Html.inputSoundVolume);
		this._rendererScaleInputElm = Html.inputElm(Html.inputRendererScale);
		this._multisamplingElm = Html.elm(Html.optionsMultisampling);
		this._multisamplingInputElm = Html.inputElm(Html.inputMultisampling);
	}

	setup() : void {
		this._optionsElm.onclick = (e) => {
			e.stopPropagation();
		};

		this._pointerLockInputElm.checked = options.enablePointerLock;
		this._shadowsInputElm.checked = options.enableShadows;
		this._effectsInputElm.checked = options.enableEffects;
		this._antialiasingInputElm.checked = options.enableAntialiasing;

		this._extrapolationInputElm.value = "" + options.extrapolateWeight;
		this._soundVolumeInputElm.value = "" + options.soundVolume;
		this._rendererScaleInputElm.value = "" + options.rendererScale;
		this._multisamplingInputElm.value = "" + options.rendererMultisampling;

		const toggleEffects = () => {
			if (options.enableEffects) {
				this._antialiasingElm.style.display = "block";
				this._multisamplingElm.style.display = "none";
			} else {
				this._antialiasingElm.style.display = "block";
				this._multisamplingElm.style.display = "none";
			}
		};
		toggleEffects();

		this._pointerLockInputElm.onchange = () => {
			options.enablePointerLock = this._pointerLockInputElm.checked;
		};
		this._shadowsInputElm.onchange = () => {
			options.enableShadows = this._shadowsInputElm.checked;
			renderer.reset();
		};
		this._effectsInputElm.onchange = () => {
			options.enableEffects = this._effectsInputElm.checked;
			toggleEffects();
			renderer.reset();
		};
		this._antialiasingInputElm.onchange = () => {
			options.enableAntialiasing = this._antialiasingInputElm.checked;
			renderer.reset();
		};


		this._extrapolationInputElm.onchange = () => {
			const weight = Math.min(1, Math.max(0, Number(this._extrapolationInputElm.value)));
			options.extrapolateWeight = weight;
		};
		this._soundVolumeInputElm.onchange = () => {
			const volume = Math.min(1, Math.max(0, Number(this._soundVolumeInputElm.value)));
			options.soundVolume = volume;
		};
		this._rendererScaleInputElm.onchange = () => {
			const scale = Math.min(1, Math.max(0.25, Number(this._rendererScaleInputElm.value)));
			options.rendererScale = scale;
			renderer.resize();
		};
		this._multisamplingInputElm.onchange = () => {
			const multisampling = Math.min(8, Math.max(0, Number(this._multisamplingInputElm.value)));
			options.rendererMultisampling = multisampling;
		};
	}

	reset() : void {

	}

	changeInputMode(mode : InputMode) : void {

	}
}