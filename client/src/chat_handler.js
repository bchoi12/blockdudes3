import { connection } from './connection.js';
import { HtmlComponent } from './html_component.js';
import { ui } from './ui.js';
import { Util } from './util.js';
export class ChatHandler {
    constructor(messagesComponent) {
        this._messagesComponent = messagesComponent;
    }
    setup() {
        connection.addHandler(chatType, (msg) => { this.chat(msg); });
    }
    chat(msg) {
        const name = ui.getClientName(msg.Client.Id);
        const message = msg.M;
        if (!Util.defined(message) || message.length === 0)
            return;
        const nameSpan = new HtmlComponent(document.createElement("span"));
        nameSpan.addClass("message-name");
        nameSpan.text(name + ": ");
        nameSpan.appendTo(this._messagesComponent);
        ui.print(message);
    }
}
