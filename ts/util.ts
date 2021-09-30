function debug(msg : string) : void {
	if (dev) {
		console.log(msg)
	}
}

function waitUntilTrue(predicate, retryTime : number, callback) : void {
    setTimeout(
        function () {
            if (predicate) {
                if (callback != null){
                    callback();
                }
            } else {
                waitUntilTrue(predicate, retryTime, callback);
                return;
            }
        }, retryTime);
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