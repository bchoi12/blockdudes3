import { LogUtil, HtmlUtil, Util } from './util.js'

import { connection } from './connection.js'
import { game, GameState } from './game.js'
import { Html } from './html.js'
import { ui, InputMode } from './ui.js'

declare var Go: any;
document.addEventListener('DOMContentLoaded', (event) => {
	HtmlUtil.displayNone("js-check");
	game.startRender();

	if (Util.isDev()) {
		LogUtil.d("Dev mode enabled!");
		HtmlUtil.inputElm(Html.inputName).value = "b";
	}
	HtmlUtil.inputElm(Html.inputRoom).value = "test_room";

	const go = new Go();
	WebAssembly.instantiateStreaming(fetch("./game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);

		ui.setup();		
		game.setup();
		ui.changeInputMode(InputMode.LOGIN);

		HtmlUtil.displayNone("wasm-check");
	});
});