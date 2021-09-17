$(document).ready(function() {
	if (dev) {
		$("#name").val("b");
		$("#room").val("room");
	}

	$("#js-check").css("display", "none");
});

function connect() {
	if (defined(window.ws)) {
		debug("Requested connection when one already exists.")
		return;
	}

	var prefix = dev ? "ws://" : "wss://"
	var endpoint = prefix + window.location.host + "/newclient/room=room&name=" + $("#name").val().trim();
	debug("starting connection to " + endpoint);
	window.ws = new WebSocket(endpoint);
	window.ws.binaryType = "arraybuffer";

	window.ws.onopen = function() {
		debug("starting game");
		window.game = startGame();
	};
	window.ws.onmessage = function(event) {
		var payload = msgpack.decode(new Uint8Array(event.data));
		handlePayload(payload)
	};
	window.ws.onclose = function() {
		debug("connection closed, opening a new one")
		delete window.ws;
		connect();
	};
}

function handlePayload(payload) {
	if (!defined(payload.T)) {
		debug("Error! Missing type for payload");
		return;
	}

	if (!defined(window.game)) {
		debug("Error! Game is not loaded");
		return;
	}

	if (payload.T != initType && window.game.id == invalidId) {
		debug("Error! Failed to initialize");
		return;
	}

	switch(payload.T) {
		case initType:
			initState(payload, window.game);
			break;

		case pingType:
			recordPing(window.game);
			break;

		case joinType:
		case leftType:
			updatePlayers(payload, window.game);
			break;

		case chatType:
			chat(payload.N + " #" + payload.Id, payload.M);
			break;

		case playerStateType:
			updatePlayerState(payload, window.game);
			return;

		case objectInitType:
			initObjects(payload, window.game);
			return;

		default:
			debug("Error, unknown type " + payload.T)
			return
	}
}

function sendPayload(payload) {
	if (!defined(window.ws)) {
		return false;
	}

	var buffer = msgpack.encode(payload);
	window.ws.send(buffer);
	return true;
}

function chat(from, message) {
	if (!defined(message) || message.length == 0) return;

	if (from.length > 0) {
		var name = $("<span class='message-name'></span>");
		name.text(from + ": ");
		$("#messages").append(name);
	}

	var msg = $("<span></span>");
	msg.text(message);
	$("#messages").append(msg);
	$("#messages").append("<br>");
	$("#messages").scrollTop($("#messages")[0].scrollHeight);
}