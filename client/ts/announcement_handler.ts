import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ScoreWrapper } from './score_wrapper.js'
import { ui, InputMode } from './ui.js'

// TODO: add TTL instead of switch?
export interface Announcement {
	enabled : boolean;
	text? : string;
}

export class AnnouncementHandler implements InterfaceHandler {

	private _announcementElm : HTMLElement;

	constructor() {
		this._announcementElm = Html.elm(Html.divAnnouncement);
	}

	setup() : void {}

	reset() : void {
		Html.displayNone(this._announcementElm);
	}

	// TODO: push announcements to stack
	announce(announcement : Announcement) {
		if (announcement.enabled) {
			this._announcementElm.textContent = announcement.text;
			Html.displayBlock(this._announcementElm);
		} else {
			Html.displayNone(this._announcementElm)
		}
	}

	changeInputMode(mode : InputMode) : void {}
}