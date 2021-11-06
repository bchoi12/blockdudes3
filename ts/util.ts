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