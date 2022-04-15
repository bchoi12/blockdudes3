const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export namespace Util {
	export function defined(object : any) : boolean {
	    return typeof object != 'undefined' && object != null;
	}

	export function arrayToString(array : Array<any>) : string {
		return array.join(",");
	}

	export function getOr(msg : any, prop : number, or : any) : any{
		if (msg.hasOwnProperty(prop)) {
			return msg[prop];
		}
		return or;
	}

	export function isDev() : boolean {
		return dev;
	}
}

export namespace LogUtil {
	export function d(msg : any) : void {
		if (dev) {
			console.log(msg)
		}
	}
}

export namespace HtmlUtil {
	export function elm(id : string) : HTMLElement {
	    return document.getElementById(id);
	}
	export function inputElm(id : string) : HTMLInputElement {
	    return (<HTMLInputElement>document.getElementById(id));
	}
	export function audioElm(id : string) : HTMLAudioElement {
		return (<HTMLAudioElement>document.getElementById(id));
	}

	export function trimmedValue(id : string) : string {
		return inputElm(id).value.trim()
	}

	export function hide(id : string) : void {
		elm(id).style.visibility = "hidden";
	}
	export function show(id : string) : void {
		elm(id).style.visibility = "visible";
	}

	export function displayNone(id : string) : void {
		elm(id).style.display = "none";
	}
	export function displayBlock(id : string) : void {
		elm(id).style.display = "block";
	}

	export function unselectable(id : string) : void {
		elm(id).classList.add("no-select");
	}
	export function selectable(id : string) : void {
		elm(id).classList.remove("no-select");
	}

	export function slightlyOpaque(id : string) : void {
		elm(id).classList.add("slightly-opaque");
	}
	export function notSlightlyOpaque(id : string) : void {
		elm(id).classList.remove("slightly-opaque");
	}

	export function isVisible(id : string) : boolean {
		return elm(id).style.visibility !== "hidden";
	}
}

export namespace MathUtil {
	export function normalize(radians : number) : number {
		if (radians >= 2 * Math.PI) {
			radians -= Math.floor(radians / (2 * Math.PI)) * 2 * Math.PI;
		}
		if (radians < 0) {
			radians += (Math.floor(-radians / (2 * Math.PI))+1) * 2 * Math.PI;
		}
		return radians;
	}

	export function signPos(n : number) : number {
		if (n == 0) {
			return 1;
		}
		return Math.sign(n);
	}

	export function randomRange(min : number, max : number) : number {
		return Math.random() * (max - min) + min;
	}
}