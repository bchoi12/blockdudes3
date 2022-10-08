import { Html, HtmlWrapper } from './html.js'
import { ui, TooltipType } from './ui.js'
import { Util } from './util.js'

export class TooltipWrapper extends HtmlWrapper {

	private _type : TooltipType;
	private _timeoutId : number;

	constructor(type : TooltipType) {
		super(Html.div());
		this.elm().classList.add(Html.divTooltip);

		setTimeout(() => {
			this.elm().classList.add("tooltip-show");
		}, 5);
	}

	type() : TooltipType {
		return this._type;
	}

	setTTL(ttl : number, onDelete : () => void) : void {
		if (Util.defined(this._timeoutId)) {
			window.clearTimeout(this._timeoutId);
		}

		this._timeoutId = window.setTimeout(() => {
			this.delete(onDelete);
		}, ttl);
	}

	setText(text : string) : void {
		this.elm().textContent = text;
	}

	delete(onDelete : () => void) : void {
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}
}