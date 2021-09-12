$(document).ready(function() {
	if (dev) {
		debugDiv("JS compiled!");

		$("#name").val("b");
		$("#room").val("room");
	}
});

function connect() {
	var prefix = dev ? "ws://" : "wss://"
	var endpoint = prefix + window.location.host + "/newclient/room=room&name=" + $("#name").val().trim();
	debug("starting connection to " + endpoint);
	window.ws = new WebSocket(endpoint);

	window.ws.onopen = function() {
		ws.binaryType = "arraybuffer";
		window.game = startGame();
	};
	window.ws.onmessage = function(event) {
		var payload = msgpack.decode(new Uint8Array(event.data));
		handlePayload(payload)
	};
	window.ws.onclose = function() {
		debug("connection closed, opening a new one")
		connect();
	};
}

function handlePayload(payload) {
	if (typeof payload.T === 'undefined') {
		debug("Error! Missing type for payload");
		return;
	}

	if (typeof window.game === 'undefined') {
		debug("Error! Game is not loaded");
		return;
	}

	if (payload.T != initType && window.game.id === invalidId) {
		debug("Error! Failed to initialize");
		return;
	}

	switch(payload.T) {
		case initType:
			initState(payload, window.game);
			break;

		case joinType:
		case leftType:
			updatePlayers(payload, window.game);
			break;

		case chatType:
			chat(payload.N + ": " + payload.M);
			break;

		case stateType:
			updateState(payload, window.game);
			return;

		default:
			debug("Error, unknown type " + payload.T)
			return
	}
}

function sendPayload(payload) {
	if (typeof window.ws === 'undefined') {
		return false;
	}

	var buffer = msgpack.encode(payload);
	window.ws.send(buffer);
	return true;
}
