import { game } from './game.js'
import { Html, SpecialName } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { TooltipWrapper } from './tooltip_wrapper.js'
import { ui, InputMode, TooltipType } from './ui.js'
import { Util } from './util.js'

export interface Tooltip {
	type : TooltipType
	// default is 1 sec
	ttl? : number
	names? : Array<SpecialName>
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

				activeWrapper.delete(() => {
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
		case TooltipType.PICKUP:
			return "Press " + Html.formatName(tooltip.names[0]) + " to pickup " + Html.formatName(tooltip.names[1]);
		case TooltipType.JOIN_TEAM:
			return "Joined the " + Html.formatName(tooltip.names[0]);
		case TooltipType.GOAL:
			return "Prevent the " + Html.formatName(tooltip.names[0]) + " from reaching this goal";
		case TooltipType.SPECTATING:
			return "Spectating " + Html.formatName(tooltip.names[0]);
		default:
			return "testing 123";
		}
	}
}