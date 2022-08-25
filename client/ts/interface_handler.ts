
import { InputMode } from './ui.js'

export interface InterfaceHandler {
	setup() : void;
	reset() : void;
	changeInputMode(mode : InputMode) : void
}

/*
import { Html } from './html.js'
import { InputMode } from './ui.js'
import { InterfaceHandler } from './interface_handler.js'

export class Handler implements InterfaceHandler {

	constructor() {

	}

	setup() : void {

	}

	reset() : void {

	}

	changeInputMode(mode : InputMode) : void {

	}
}
*/