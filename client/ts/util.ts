const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export namespace Util {
	export function defined(object : any) : boolean {
	    return typeof object != 'undefined';
	}

	export function arrayToString(array : Array<any>) : string {
		return array.join(",");
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
}

export namespace GameUtil {
	export function sid(space : number, id : number) : string{
		return space + "," + id;
	}
	export function space(sid : string) : number {
		return Number(sid.split(",")[0]);
	}
	export function id(sid : string) : number {
		return Number(sid.split(",")[1])
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
}