import { LogUtil, HtmlUtil, Util } from './util.js'

import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { ui } from './ui.js'

declare var Go: any;

const go = new Go();

let wasmLoaded = false;
document.addEventListener('DOMContentLoaded', (event) => {

	// TODO: move this code to UI
	HtmlUtil.displayNone("js-check");
	if (Util.isDev()) {
		LogUtil.d("Dev mode enabled!");
		HtmlUtil.inputElm(Html.inputName).value = "b";
	}
	HtmlUtil.inputElm(Html.inputRoom).value = "test_room";

	WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);
		wasmLoaded = true;

		ui.setup();		
		game.setup();
		game.setState(GameState.LOGIN);

		HtmlUtil.displayNone("wasm-check");
		HtmlUtil.elm(Html.buttonLogin).style.display = "block";
	});
})

// TODO: move this code to UI
HtmlUtil.elm(Html.formLogin).onsubmit = () => {
	if (!wasmLoaded) return;

	const room = HtmlUtil.trimmedValue(Html.inputRoom);
	const name = HtmlUtil.trimmedValue(Html.inputName);
	connection.connect(room, name, () => {}, () => {
		ui.startGame();
		game.setState(GameState.GAME);
	});
};