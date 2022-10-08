export namespace Html {

	export const divGame = "div-game";

	export const divLogin = "div-login";
	export const legendLogin = "legend-login";
	export const inputName = "input-name";
	export const inputRoom = "input-room";
	export const loginInfo = "login-info";
	export const formLogin = "form-login";
	export const buttonLogin = "button-login";

	export const divOverlays = "div-overlays";

	export const divStats = "div-stats";

	export const divChat = "div-chat";
	export const divMessage = "div-message";
	export const inputMessage = "input-message";

	export const divTooltips = "div-tooltips";
	export const divTooltip = "div-tooltip";
	export const divAnnouncement = "div-announcement";
	export const divScoreboard = "div-scoreboard";

	export const divPause = "div-pause";
	export const fieldsetClients = "fieldset-clients";
	export const fieldsetOptions = "fieldset-options";
	export const optionsAntialiasing = "options-antialiasing";
	export const inputPointerLock = "input-pointer-lock";
	export const inputShadows = "input-shadows";
	export const inputEffects = "input-effects";
	export const inputDynamicLighting = "input-dynamic-lighting";
	export const inputAntialiasing = "input-antialiasing";
	export const inputExtrapolation = "input-extrapolation";
	export const inputSoundVolume = "input-sound-volume";
	export const inputResolution = "input-resolution";
	export const fieldsetKeyBindings = "fieldset-key-bindings";
	export const pauseContinue = "pause-continue";

	export const cursor = "cursor";

	export function elm(id : string) : HTMLElement { return document.getElementById(id); }
	export function canvasElm(id : string) : HTMLCanvasElement { return (<HTMLCanvasElement>document.getElementById(id)); }
	export function inputElm(id : string) : HTMLInputElement { return (<HTMLInputElement>document.getElementById(id)); }

	export function div() : HTMLElement { return document.createElement("div"); }
	export function span() : HTMLElement { return document.createElement("span"); }
	export function br() : HTMLElement { return document.createElement("br"); }
	export function audio() : HTMLAudioElement { return <HTMLAudioElement>document.createElement("audio"); }
	export function button() : HTMLElement { return document.createElement("button"); }
	export function icon() : HTMLElement { return document.createElement("i"); }
	export function range() : HTMLInputElement {
		let range = <HTMLInputElement>document.createElement("input");
		range.type = "range";
		return range;
	}

	export function hide(elm : HTMLElement) : void {
		elm.style.visibility = "hidden";
	}
	export function show(elm : HTMLElement) : void {
		elm.style.visibility = "visible";
	}

	export function displayNone(elm : HTMLElement) : void {
		elm.style.display = "none";
	}
	export function displayFlex(elm : HTMLElement) : void {
		elm.style.display = "flex";
	}
	export function displayBlock(elm : HTMLElement) : void {
		elm.style.display = "block";
	}

	export function textButton(elm : HTMLElement) : void {
		elm.classList.add("text-button");
	}

	export function bold(elm : HTMLElement) : void {
		elm.classList.add("bold");
	}

	export function unselectable(elm : HTMLElement) : void {
		elm.classList.add("no-select");
	}
	export function selectable(elm : HTMLElement) : void {
		elm.classList.remove("no-select");
	}

	export function slightlyOpaque(elm : HTMLElement) : void {
		elm.classList.add("slightly-opaque");
	}
	export function notSlightlyOpaque(elm : HTMLElement) : void {
		elm.classList.remove("slightly-opaque");
	}

	export function trimmedValue(inputElm : HTMLInputElement) : string {
		return inputElm.value.trim()
	}
}

export class HtmlWrapper {
	private _elm : HTMLElement;

	constructor(elm : HTMLElement) {
		this._elm = elm;
	}

	elm() : HTMLElement { return this._elm; }

	removeChildren() : void {
		while (this._elm.firstChild) {
			this._elm.removeChild(this._elm.firstChild);
		}
	}
}