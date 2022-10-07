import { Html, HtmlWrapper } from './html.js'
import { ui, TooltipType } from './ui.js'
import { Util } from './util.js'

export class TooltipWrapper extends HtmlWrapper {

	private _type : TooltipType;
	private _timeoutId : number;

	constructor(type : TooltipType) {
		super(Html.div());
		this.elm().classList.add(Html.divTooltip);
	}

	type() : TooltipType {
		return this._type;
	}

	setTTL(ttl : number, cb : () => void) : void {
		if (Util.defined(this._timeoutId)) {
			window.clearTimeout(this._timeoutId);
		}

		this._timeoutId = window.setTimeout(() => {
			this.elm().parentNode.removeChild(this.elm());
			cb();
		}, ttl);
	}

	setText(text : string) : void {
		this.elm().textContent = text;
	}
}