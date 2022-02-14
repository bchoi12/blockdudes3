import { Connection } from './connection.js'
import { Game } from './game.js'
import { LogUtil, HtmlUtil, Util } from './util.js'
import { UI } from './ui.js'

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
	});
})

function connect() {
	const room = HtmlUtil.inputElm("room").value.trim();
	const name = HtmlUtil.inputElm("name").value.trim();

	const connection = new Connection(room, name);
	const ui = new UI(HtmlUtil.elm("div-game"), connection);
	const game = new Game(ui, connection);

	connection.connect();
	
	function startGame() {
		if (connection.ready()) {
			LogUtil.d("Start game");
			game.start();
		} else {
			setTimeout(startGame, 100);
		}
	}
	startGame();
}

HtmlUtil.elm("form-login").onsubmit = connect;