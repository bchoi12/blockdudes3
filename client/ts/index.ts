import { LogUtil, Util } from './util.js'

import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { ui, InputMode } from './ui.js'

declare var Go: any;

const clientVersion = "0.1";

document.addEventListener('DOMContentLoaded', (event) => {
	Html.elm(Html.loginInfo).textContent = "Loading game instance..."
	game.startRender();

	if (Util.isDev()) {
		LogUtil.d("Dev mode enabled!");
		Html.inputElm(Html.inputName).value = "b";
	}
	Html.inputElm(Html.inputRoom).value = "test_room";

	const go = new Go();
	WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);
		Html.elm(Html.loginInfo).textContent = ""

		// TODO: ErrorHandler ui component
		if (!Util.defined(wasmVersion) || wasmVersion !== clientVersion) {
			ui.print("Your game is outdated. Please refresh to download the latest stuff");
			return;
		}

		connection.setup();
		ui.setup();
		game.setup();
		ui.changeInputMode(InputMode.LOGIN);
	});
});