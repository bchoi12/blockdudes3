const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export namespace Util {
	export function defined(object : any) : boolean {
	    return typeof object != 'undefined' && object != null;
	}

	export function arrayToString(array : Array<any>) : string {
		return array.join(",");
	}

	export function randomElement(array : Array<any>) : any {
		return array[Math.floor(Math.random() * array.length)];	
	}

	export function shuffleArray(array : Array<any>) : void {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
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

	export function w(msg : any) : void {
		if (dev) {
			console.error(msg);
		}
	}

	export function e(msg : any) : void {
		console.error(msg);
	}
}

export namespace MathUtil {
	export function clamp(min : number, n : number, max : number) : number {
		return Math.min(max, Math.max(min, n));
	}

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