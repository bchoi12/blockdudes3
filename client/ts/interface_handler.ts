
import { InputMode } from './ui.js'

export interface InterfaceHandler {
	setup() : void;
	changeInputMode(mode : InputMode) : void
}