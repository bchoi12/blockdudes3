import { Html } from './html.js'
import { InputMode } from './ui.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { renderer } from './renderer.js'

export class OptionsHandler implements InterfaceHandler {

	private _optionsElm : HTMLElement;

	private _clientPredictionInputElm : HTMLInputElement;
	private _pointerLockInputElm : HTMLInputElement;
	private _shadowsInputElm : HTMLInputElement;
	private _effectsInputElm : HTMLInputElement;
	private _dynamicLightingInputElm : HTMLInputElement;
	private _rendererScaleInputElm : HTMLInputElement;
	private _multisamplingInputElm : HTMLInputElement;

	constructor() {
		this._optionsElm = Html.elm(Html.fieldsetOptions);

		this._clientPredictionInputElm = Html.inputElm(Html.inputClientPrediction);
		this._pointerLockInputElm = Html.inputElm(Html.inputPointerLock);
		this._shadowsInputElm = Html.inputElm(Html.inputShadows);
		this._effectsInputElm = Html.inputElm(Html.inputEffects);
		this._dynamicLightingInputElm = Html.inputElm(Html.inputDynamicLighting);
		this._rendererScaleInputElm = Html.inputElm(Html.inputRendererScale);
		this._multisamplingInputElm = Html.inputElm(Html.inputMultisampling);
	}

	setup() : void {
		this._optionsElm.onclick = (e) => {
			e.stopPropagation();
		};

		// TODO: make class
		this._clientPredictionInputElm.checked = options.enableClientPrediction;
		this._pointerLockInputElm.checked = options.enablePointerLock;
		this._shadowsInputElm.checked = options.enableShadows;
		this._effectsInputElm.checked = options.enableEffects;
		this._dynamicLightingInputElm.checked = options.enableDynamicLighting;
		this._rendererScaleInputElm.value = "" + options.rendererScale * 100;
		this._multisamplingInputElm.value = "" + options.rendererMultisampling;

		this._clientPredictionInputElm.onchange = () => {
			options.enableClientPrediction = this._clientPredictionInputElm.checked;
		};
		this._pointerLockInputElm.onchange = () => {
			options.enablePointerLock = this._pointerLockInputElm.checked;
		};
		this._shadowsInputElm.onchange = () => {
			options.enableShadows = this._shadowsInputElm.checked;
			renderer.reset();
		};
		this._effectsInputElm.onchange = () => {
			options.enableEffects = this._effectsInputElm.checked;
		};
		this._dynamicLightingInputElm.onchange = () => {
			options.enableDynamicLighting = this._dynamicLightingInputElm.checked;
		};
		this._rendererScaleInputElm.onchange = () => {
			const scale = Math.min(1, Math.max(0.25, Number(this._rendererScaleInputElm.value) / 100));
			options.rendererScale = scale;
			renderer.reset();
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