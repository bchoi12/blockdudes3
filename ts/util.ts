function debug(msg : any) : void {
	if (dev) {
		console.log(msg)
	}
}

function defined(object : any) : boolean {
    return typeof object != 'undefined';
}

function elm(id : string) : HTMLElement {
    return document.getElementById(id);
}
function inputElm(id : string) : HTMLInputElement {
    return (<HTMLInputElement>document.getElementById(id));
}
function audioElm(id : string) : HTMLAudioElement {
	return (<HTMLAudioElement>document.getElementById(id));
}

function sid(space : number, id : number) : string{
	return space + "," + id;
}
function space(sid : string) : number {
	return Number(sid.split(",")[0]);
}
function id(sid : string) : number {
	return Number(sid.split(",")[1])
}
function arrayToString(array : Array<number>) : string {
	return array.join(",");
}

function normalize(radians : number) : number {
	if (radians >= 2 * Math.PI) {
		radians -= Math.floor(radians / (2 * Math.PI)) * 2 * Math.PI;
	}
	if (radians < 0) {
		radians += (Math.floor(-radians / (2 * Math.PI))+1) * 2 * Math.PI;
	}
	return radians;
}