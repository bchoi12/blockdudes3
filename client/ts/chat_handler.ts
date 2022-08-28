
import { connection } from './connection.js'
import { game } from './game.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { options } from './options.js'
import { SceneComponentType } from './scene_component.js'
import { ui, InputMode } from './ui.js'
import { Util } from './util.js'

export class ChatHandler implements InterfaceHandler {
	private _chatElm : HTMLElement;
	private _messageElm : HTMLElement;
	private _messageInputElm : HTMLInputElement;

	constructor() {
		this._chatElm = Html.elm(Html.divChat);
		this._messageElm = Html.elm(Html.divMessage);
		this._messageInputElm = Html.inputElm(Html.inputMessage);
	}

	setup() : void {
		this._messageInputElm.style.width = this._chatElm.offsetWidth + "px";

		connection.addHandler(chatType, (msg : { [k: string]: any }) => { this.chat(msg) })
		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === options.chatKeyCode) {
				this.chatKeyPressed();
			}
			if (e.keyCode === options.pauseKeyCode && ui.inputMode() === InputMode.CHAT) {
				ui.changeInputMode(InputMode.GAME);
			}
		});
	}

	reset() : void {}

	changeInputMode(mode : InputMode) : void {
		if (mode === InputMode.CHAT) {
			Html.notSlightlyOpaque(this._chatElm);
			Html.selectable(this._chatElm);
			Html.displayBlock(this._messageElm);
			this._chatElm.style.bottom = "2em";
			this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
			this._messageInputElm.focus();
		} else {
			Html.slightlyOpaque(this._chatElm);
			Html.unselectable(this._chatElm);
			Html.displayNone(this._messageElm);
			this._chatElm.style.bottom = "1em";
			this._chatElm.style.backgroundColor = "";
			this._messageInputElm.blur();
		}

		// TODO: this should go somewhere else
		if (game.timeOfDay() >= 0.5) {
			this._chatElm.style.color = "#f2f2f2";
			this._chatElm.style.backgroundColor = "";
		} else {
			this._chatElm.style.color = "#000000";
		}
	}

	print(message : string) : void {
		const messageSpan = Html.span();
		messageSpan.textContent = message;

		this._chatElm.append(messageSpan);
		this._chatElm.append(Html.br());
		this._chatElm.scrollTop = this._chatElm.scrollHeight;
	}

	private command(message : string) {
		const pieces = message.trim().split(" ");
		if (pieces.length === 0) {
			return;
		}

		switch (pieces[0].toLowerCase()) {
		case "/dc":
			connection.disconnect();
			break;
		case "/dcwebrtc":
			connection.disconnectWebRTC();
			break;
		case "/t":
			if (pieces.length === 2) {
				game.setTimeOfDay(Number(pieces[1]));
			}
			break;
		case "/deletelights":
			ui.print("TODO: support this")
			break;
		default:
			ui.print("Unknown command: " + message);
		}
	}

	private chatKeyPressed() : void {
		if (ui.inputMode() === InputMode.GAME) {
			ui.changeInputMode(InputMode.CHAT);
			return;
		} else if (ui.inputMode() !== InputMode.CHAT) {
			return;
		}

		const message = Html.trimmedValue(this._messageInputElm);
		if (message.length == 0) {
			ui.changeInputMode(InputMode.GAME);
			return;
		}

		if (message.startsWith("/")) {
			this.command(message);
			this._messageInputElm.value = "";
			ui.changeInputMode(InputMode.GAME);
			return;
		}

		if (!connection.ready()) {
			ui.print("Unable to send message, not connected to server!")
			return;
		}

		const chatMsg = {
			T: chatType,
			Chat: {
				M: message,
			}
		};

		if (connection.send(chatMsg)) {
			this._messageInputElm.value = "";
			ui.changeInputMode(InputMode.GAME);
		} else {
			ui.print("Failed to send chat message!");
		}
	}

	private chat(msg : { [k: string]: any }) {
		if (!ui.hasClient(msg.Id)) {
			return;
		}

		const name = ui.getClientName(msg.Id);
		const message = msg.M;

		if (!Util.defined(message) || message.length === 0) return;

		const nameSpan = Html.span();
		Html.bold(nameSpan);
		nameSpan.textContent = name + ": ";
		this._chatElm.append(nameSpan);

		ui.print(message);
	}
}