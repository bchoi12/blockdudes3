import { game } from './game.js'
import { Html, SpecialName } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { ScoreWrapper } from './score_wrapper.js'
import { ui, AnnouncementType, InputMode } from './ui.js'

export interface Announcement {
	type : AnnouncementType;
	ttl : number;
	names? : Array<SpecialName>
}

export class AnnouncementHandler implements InterfaceHandler {

	private _active : boolean;
	private _announcementElm : HTMLElement;
	private _mainAnnouncementElm : HTMLElement;
	private _subAnnouncementElm : HTMLElement;
	private _announcements : Array<Announcement>;

	constructor() {
		this._active = false;
		this._announcementElm = Html.elm(Html.divAnnouncement);
		this._mainAnnouncementElm = Html.elm(Html.divMainAnnouncement);
		this._subAnnouncementElm = Html.elm(Html.divSubAnnouncement);
		this._announcements = new Array<Announcement>();
	}

	setup() : void {}

	reset() : void {
		Html.displayNone(this._announcementElm);
	}

	announce(announcement : Announcement) {
		this._announcements.push(announcement);
		if (!this._active) {
			this.popAnnouncement();
		}
	}

	changeInputMode(mode : InputMode) : void {}

	private popAnnouncement() {
		if (this._announcements.length === 0) {
			Html.displayNone(this._announcementElm);
			this._active = false;
			return;
		}

		const announcement = this._announcements.shift();
		const htmls = this.getHtmls(announcement);
		this._mainAnnouncementElm.innerHTML = htmls[0];
		this._subAnnouncementElm.innerHTML = htmls[1];
		Html.displayBlock(this._announcementElm);
		this._active = true;

		setTimeout(() => {
			this.popAnnouncement();
		}, announcement.ttl);
	}

	private getHtmls(announcement : Announcement) : Array<string> {
		switch (announcement.type) {
		case AnnouncementType.WELCOME:
			return ["Welcome " + Html.formatName(announcement.names[0]), ""];
		case AnnouncementType.PROTECT:
			return ["Escort " + Html.formatName(announcement.names[0]) + " to the exit portal", "Or eliminate the other team"];
		case AnnouncementType.REACH:
			return ["Reach the " + Html.formatName(announcement.names[0]), "Or eliminate the other team"];
		case AnnouncementType.ELIMINATE:
			return ["Eliminate the " + Html.formatName(announcement.names[0]), ""];
		case AnnouncementType.SCORE:
			return [Html.formatName(announcement.names[0]) + " - " + Html.formatName(announcement.names[1]), ""];
		default:
			return ["testing", "123"];
		}
	}
}