
import { InputMode } from './ui.js'

export interface InterfaceHandler {
	setup() : void;
	reset() : void;
	changeInputMode(mode : InputMode) : void
}