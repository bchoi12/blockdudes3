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

function mapToJSON(map : Map<any, any>) : any {
	const object = {};
	for (const [key, value] of Object.entries(map) as [string, any]) {
		object[key] = value;
	}
    return object;
}