
// TODO: rename to UIComponent?
export class HtmlComponent {

	private _html : HTMLElement;
	private _parents : Array<HtmlComponent>;

	constructor(html : HTMLElement) {
		this._html = html;
		this._parents = new Array();
	}

	elm() : HTMLElement { return this._html; }

	displayBlock() : void { this._html.style.display = "block"; }
	displayNone() : void { this._html.style.display = "none"; }
	addClass(htmlClass : string) : void { this._html.classList.add(htmlClass); }
	text(text : string) : void { this._html.textContent = text; }
	textAlign(align : string) : void { this._html.style.textAlign = align; }
	padding(pixels : number) : void { this._html.style.padding = pixels + "px"; }

	prependTo(parent : HtmlComponent) : void {
		parent.elm().prepend(this.elm());
		this._parents.push(parent);
	}

	appendTo(parent : HtmlComponent) : void {
		parent.elm().append(this.elm());
		this._parents.push(parent);
	}

	appendElm(elm : HTMLElement) : void {
		this.elm().append(elm);
	}

	delete() : void {
		this._parents.forEach((parent) => {
			parent.elm().removeChild(this.elm());
		});
	}
}