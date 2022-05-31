
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { ui } from './ui.js'
import { Util } from './util.js'

export class ChatHandler {

	private _messagesComponent : HtmlComponent;

	constructor(messagesComponent : HtmlComponent) {
		this._messagesComponent = messagesComponent;
	}

	setup() : void {
		connection.addHandler(chatType, (msg : { [k: string]: any }) => { this.chat(msg) })
	}

	private chat(msg : { [k: string]: any }) {
		const name = ui.getClientName(msg.Client.Id);
		const message = msg.M;

		if (!Util.defined(message) || message.length === 0) return;

		const nameSpan = new HtmlComponent(document.createElement("span"));
		nameSpan.addClass("message-name");
		nameSpan.text(name + ": ");
		nameSpan.appendTo(this._messagesComponent);

		ui.print(message);
	}
}