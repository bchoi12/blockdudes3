import * as THREE from 'three';

import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { renderer } from './renderer.js'
import { ui, InputMode } from './ui.js'

export class InputHandler implements InterfaceHandler {
	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;

	private _cursorElm : HTMLElement;
	private _mouse : THREE.Vector2;
	private _lastPointerLock : number;
	private _keys : Set<number>;
	private _keyMap : Map<number, number>;
	private _reverseKeyMap : Map<number, Array<number>>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	constructor() {
		this._cursorElm = Html.elm(Html.cursor);
		this._mouse = new THREE.Vector2();
		this._lastPointerLock = 0;
		this._keys = new Set<number>();
		this._keyMap = new Map();
		this._reverseKeyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();
	}

	setup() : void {
		this.mapKey(37, leftKey);
		this.mapKey(65, leftKey);
		this.mapKey(39, rightKey);
		this.mapKey(68, rightKey);
		this.mapKey(32, jumpKey);
		this.mapKey(38, jumpKey);
		this.mapKey(69, interactKey);

		document.addEventListener("keydown", (e : any) => {
			if (this._keyDownCallbacks.has(e.keyCode)) {
				this._keyDownCallbacks.get(e.keyCode)(e);
			}
		});
		document.addEventListener("keyup", (e : any) => {
			if (this._keyUpCallbacks.has(e.keyCode)) {
				this._keyUpCallbacks.get(e.keyCode)(e);
			}
		});
    	document.addEventListener("mousemove", (e : any) => { this.recordMouse(e); });
    	document.addEventListener("mousedown", (e : any) => { this.mouseDown(e); });
    	document.addEventListener("mouseup", (e : any) => { this.mouseUp(e); });
		document.addEventListener("pointerlockchange", (e : any) => {
			if(this.pointerLocked()) {
				Html.show(this._cursorElm);
				this._lastPointerLock = Date.now();
			} else {
				Html.hide(this._cursorElm);
				if (ui.inputMode() === InputMode.GAME) {
					ui.changeInputMode(InputMode.PAUSE);
				}
			}
		});
		document.addEventListener("pointerlockerror", (e : any) => {
			if (ui.inputMode() !== InputMode.GAME) {
				return;
			}
			setTimeout(() => {
				if (ui.inputMode() === InputMode.GAME) {
					this.pointerLock();
				}
			}, 1000);
		});
	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.GAME) {
			this.pointerLock();
		} else {
			this._keys.clear();
			this.pointerUnlock();
		}
	}

	keys() : Set<number> { return this._keys; }

	addKeyDownListener(keyCode : number, cb : (e : any) => void) : void {
		this._keyDownCallbacks.set(keyCode, cb);
	}

	addKeyUpListener(keyCode : number, cb : (e : any) => void) : void {
		this._keyUpCallbacks.set(keyCode, cb);
	}

	private mapKey(keyCode : number, key : number) {
		this._keyMap.set(keyCode, key);

		if (!this._reverseKeyMap.has(key)) {
			this._reverseKeyMap.set(key, Array<number>());
		}
		this._reverseKeyMap.get(key).push(keyCode);

		this.addKeyDownListener(keyCode, (e : any) => { this.keyDown(e); });
		this.addKeyUpListener(keyCode, (e : any) => { this.keyUp(e); });
	}

	private keyDown(e : any) : void {
		if (ui.inputMode() != InputMode.GAME) return;
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (!this._keys.has(key)) {
			this._keys.add(key);
		}
	}

	private keyUp(e : any) : void {
		if (ui.inputMode() != InputMode.GAME) return;
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (this._keys.has(key)) {
			this._keys.delete(key);
		}
	}

	private mouseDown(e : any) : void {
		if (ui.inputMode() != InputMode.GAME) {
			return;
		}

		let button = mouseClick;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = altMouseClick;
	    }

		if (!this._keys.has(button)) {
			this._keys.add(button);
		}
	}

	private mouseUp(e : any) : void {
		if (ui.inputMode() != InputMode.GAME) {
			return;
		}

		let button = mouseClick;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = altMouseClick;
	    }

		this._keys.delete(button);
	}

	private recordMouse(e : any) : void {
		if (!this.pointerLocked()) {
			this._mouse.x = e.clientX;
			this._mouse.y = e.clientY;
		} else {
			this._mouse.x += e.movementX;
			this._mouse.y += e.movementY;
    	}

		if (this._mouse.x > window.innerWidth) {
			this._mouse.x = window.innerWidth;
		} else if (this._mouse.x < 0) {
			this._mouse.x = 0;
		}
		if (this._mouse.y > window.innerHeight) {
			this._mouse.y = window.innerHeight;
		} else if (this._mouse.y < 0) {
			this._mouse.y = 0;
		}

		this._cursorElm.style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
		this._cursorElm.style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
		renderer.setMouseFromPixels(this._mouse);
	}

	private pointerLock() : void {
		if (options.pointerLock) {
			renderer.elm().requestPointerLock();
		}
	}
	private pointerUnlock() : void {
		document.exitPointerLock();
	}
	private pointerLocked() : boolean {
		return document.pointerLockElement === renderer.elm()
	}
}