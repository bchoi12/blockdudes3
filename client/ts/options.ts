
class Options {
	public enableShadows : boolean;
	public rendererScale : number;

	constructor() {
		this.enableShadows = true;
		this.rendererScale = 0.66;
	}

	load() : void {
		
	}

	save() : void {

	}
}

export const options = new Options();