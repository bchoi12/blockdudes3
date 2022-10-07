import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { TooltipWrapper } from './tooltip_wrapper.js'
import { ui, InputMode, TooltipType } from './ui.js'
import { Util } from './util.js'

export interface Tooltip {
	type : TooltipType
	// default is 1 sec
	ttl? : number
	name? : string
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
		if (this._tooltips.has(tooltip.type)) {
			this._tooltipsElm.removeChild(this._tooltips.get(tooltip.type).elm());
			this._tooltips.delete(tooltip.type);
		} 

		for (let [type, activeWrapper] of this._tooltips) {
			if (this._tooltips.size < this._maxTooltips) {
				break;
			}

			this._tooltips.delete(type);
			this._tooltipsElm.removeChild(activeWrapper.elm());
		}

		let wrapper = new TooltipWrapper(tooltip.type);
		this._tooltips.set(tooltip.type, wrapper);
		this._tooltipsElm.appendChild(wrapper.elm());

		wrapper.setText(this.getText(tooltip));
		wrapper.setTTL(Util.defined(tooltip.ttl) ? tooltip.ttl : 1000, () => {
			this._tooltips.delete(tooltip.type);
		});
	}

	changeInputMode(mode : InputMode) : void {}

	private getText(tooltip : Tooltip) : string{
		switch (tooltip.type) {
		case TooltipType.HELLO:
			return "Hello!\r\nWelcome";
		case TooltipType.PICKUP:
			return "Press \'" + String.fromCharCode(69) + "\' to pickup " + tooltip.name;
		default:
			return "testing 123";
		}
	}
}