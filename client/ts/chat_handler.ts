
import { connection } from './connection.js'
import { Html } from './html.js'
import { HtmlComponent } from './html_component.js'
import { ui, InputMode } from './ui.js'
import { HtmlUtil, Util } from './util.js'

export class ChatHandler {
	private readonly _chatKeyCode = 13;

	private _chatComponent : HtmlComponent;

	constructor(chatComponent : HtmlComponent) {
		this._chatComponent = chatComponent;
	}

	setup() : void {
		HtmlUtil.elm(Html.inputMessage).style.width = this._chatComponent.elm().offsetWidth + "px";

		connection.addHandler(chatType, (msg : { [k: string]: any }) => { this.chat(msg) })
		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode === this._chatKeyCode) {
				this.chatKeyPressed();
			}
		});
	}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.CHAT) {
			HtmlUtil.notSlightlyOpaque(Html.divChat);
			HtmlUtil.selectable(Html.divChat);
			HtmlUtil.displayBlock(Html.divMessage);
			HtmlUtil.elm(Html.divChat).style.bottom = "2em";
			HtmlUtil.inputElm(Html.inputMessage).focus();
		} else {
			HtmlUtil.slightlyOpaque(Html.divChat);
			HtmlUtil.unselectable(Html.divChat);
			HtmlUtil.displayNone(Html.divMessage);
			HtmlUtil.elm(Html.divChat).style.bottom = "1em";
			HtmlUtil.inputElm(Html.inputMessage).blur();
		}
	}

	print(message : string) : void {
		const messageSpan = document.createElement("span");
		messageSpan.textContent = message;

		this._chatComponent.appendElm(messageSpan);
		this._chatComponent.appendElm(document.createElement("br"));
		HtmlUtil.elm(Html.divChat).scrollTop = HtmlUtil.elm(Html.divChat).scrollHeight;
	}

	private chatKeyPressed() : void {
		if (ui.inputMode() === InputMode.GAME) {
			ui.changeInputMode(InputMode.CHAT);
			return;
		}

		if (HtmlUtil.trimmedValue(Html.inputMessage).length == 0) {
			ui.changeInputMode(InputMode.GAME);
			return;
		}

		if (!connection.ready()) {
			ui.print("Unable to send message, not connected to server!")
		}

		const message = {
			T: chatType,
			Chat: {
				M: HtmlUtil.trimmedValue(Html.inputMessage),
			}
		};

		if (connection.send(message)) {
			HtmlUtil.inputElm(Html.inputMessage).value = "";
			ui.changeInputMode(InputMode.GAME);
		} else {
			ui.print("Failed to send chat message!");
		}
	}

	private chat(msg : { [k: string]: any }) {
		const name = ui.getClientName(msg.Client.Id);
		const message = msg.M;

		if (!Util.defined(message) || message.length === 0) return;

		const nameSpan = new HtmlComponent(document.createElement("span"));
		nameSpan.addClass("message-name");
		nameSpan.text(name + ": ");
		nameSpan.appendTo(this._chatComponent);

		ui.print(message);
	}
}