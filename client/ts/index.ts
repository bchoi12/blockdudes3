import { LogUtil, Util } from './util.js'

import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { ui, InputMode } from './ui.js'

declare var Go: any;
document.addEventListener('DOMContentLoaded', (event) => {
	Html.displayNone(Html.elm("js-check"));
	game.startRender();

	if (Util.isDev()) {
		LogUtil.d("Dev mode enabled!");
		Html.inputElm(Html.inputName).value = "b";
	}
	Html.inputElm(Html.inputRoom).value = "test_room";

	const go = new Go();
	WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);

		connection.setup();
		ui.setup();
		game.setup();
		ui.changeInputMode(InputMode.LOGIN);

		Html.displayNone(Html.elm("wasm-check"));
	});
});