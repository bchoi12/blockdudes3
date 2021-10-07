declare var Go: any;
declare var msgpack: any;
declare var THREE: any;

const go = new Go();
document.addEventListener('DOMContentLoaded', (event) => {
	if (dev) {
		inputElm("name").value = "b";
		inputElm("room").value = "room";
	}

	elm("js-check").style.display = "none";

	WebAssembly.instantiateStreaming(fetch("/wasm/game.wasm"), go.importObject).then((result) => {
		go.run(result.instance);
	});
})

function connect() {
	const room = "room";
	const name = inputElm("name").value.trim();

	const connection = new Connection(room, name);
	const ui = new UI(elm("div-game"), connection);
	const game = new Game(ui, connection);

	connection.connect();
	
	function startGame() {
		if (connection.ready()) {
			game.start();
		} else {
			setTimeout(startGame, 100);
		}
	}
	startGame();
}
