import { LogUtil, HtmlUtil, Util } from './util.js'

import { connection } from './connection.js'
import { game } from './game.js'
import { ui } from './ui.js'

declare var Go: any;

const go = new Go();
document.addEventListener('DOMContentLoaded', (event) => {
	HtmlUtil.elm("js-check").style.display = "none";
	if (Util.isDev()) {
		LogUtil.d("Dev mode enabled!");
	} else {
		if (location.protocol !== "https:") {
			location.protocol = "https:";
		}
	}

	HtmlUtil.inputElm("name").value = "b";
	HtmlUtil.inputElm("room").value = "room";

	WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);

		ui.setup();
		game.setup();
	});
})

function connect() {
	const room = HtmlUtil.inputElm("room").value.trim();
	const name = HtmlUtil.inputElm("name").value.trim();
	connection.connect(room, name, () => {
	}, () => {
		game.start();
		ui.displayGame();
	});
}
HtmlUtil.elm("form-login").onsubmit = connect;