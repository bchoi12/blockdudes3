import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { TooltipWrapper } from './tooltip_wrapper.js'
import { ui, InputMode, TooltipType, TooltipName } from './ui.js'
import { Util } from './util.js'

export interface Tooltip {
	type : TooltipType
	// default is 1 sec
	ttl? : number
	names? : Array<TooltipName>
}

export class TooltipHandler implements InterfaceHandler {
	private readonly _maxTooltips : number = 3;

	private _tooltips : Map<TooltipType, TooltipWrapper>;
	private _tooltipsElm : HTMLElement;

	constructor() {
		this._tooltips = new Map<TooltipType, TooltipWrapper>();
		this._tooltipsElm = Html.elm(Html.divTooltips);
	}

	setup() : void {}

	reset() : void {
		Html.displayNone(this._tooltipsElm);
	}

	tooltip(tooltip : Tooltip) {
		let wrapper;
		if (this._tooltips.has(tooltip.type)) {
			wrapper = this._tooltips.get(tooltip.type);
		} else {
			for (let [type, activeWrapper] of this._tooltips) {
				if (this._tooltips.size < this._maxTooltips) {
					break;
				}

				wrapper.delete(() => {
					this._tooltips.delete(type);
				})
			}

			wrapper = new TooltipWrapper(tooltip.type);
			this._tooltips.set(tooltip.type, wrapper);
			this._tooltipsElm.appendChild(wrapper.elm());
		}

		wrapper.setHtml(this.getHtml(tooltip));
		wrapper.setTTL(Util.defined(tooltip.ttl) ? tooltip.ttl : 1000, () => {
			this._tooltips.delete(tooltip.type);
		});
	}

	changeInputMode(mode : InputMode) : void {}

	private getHtml(tooltip : Tooltip) : string{
		switch (tooltip.type) {
		case TooltipType.HELLO:
			return "Hello!<br>Welcome to birdtown";
		case TooltipType.PICKUP:
			return "Press " + this.formatName(tooltip.names[0]) + " to pickup " + this.formatName(tooltip.names[1]);
		case TooltipType.TEAM_PORTAL:
			return "Joined the " + this.formatName(tooltip.names[0]) + "<br>Go team!";
		case TooltipType.GOAL:
			return "Prevent the " + this.formatName(tooltip.names[0]) + " from reaching this goal";
		default:
			return "testing 123";
		}
	}

	private formatName(name : TooltipName) : string {
		let span = Html.span();
		span.textContent = name.text;
		span.style.fontWeight = "bold";
		if (name.color) {
			span.style.color = name.color;
		}
		return span.outerHTML;
	}
}