export class HtmlComponent {
    constructor(html) {
        this._html = html;
        this._parents = new Array();
    }
    htmlElm() { return this._html; }
    displayBlock() { this._html.style.display = "block"; }
    displayNone() { this._html.style.display = "none"; }
    addClass(htmlClass) { this._html.classList.add(htmlClass); }
    text(text) { this._html.textContent = text; }
    textAlign(align) { this._html.style.textAlign = align; }
    padding(pixels) { this._html.style.padding = pixels + "px"; }
    prependTo(parent) {
        parent.htmlElm().prepend(this.htmlElm());
        this._parents.push(parent);
    }
    appendTo(parent) {
        parent.htmlElm().append(this.htmlElm());
        this._parents.push(parent);
    }
    appendElm(elm) {
        this.htmlElm().append(elm);
    }
    delete() {
        this._parents.forEach((parent) => {
            parent.htmlElm().removeChild(this.htmlElm());
        });
    }
}
