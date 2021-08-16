$( document ).ready(function() {
	connect();

	$("#send").click(function() {
		if (typeof window.ws === 'undefined') {
			return;
		}

		var payload = {
			Message: $("#message").val().trim()
		}
		sendMessage(payload);
	});
});

function sendMessage(payload) {
	var buffer = msgpack.encode(payload);
	window.ws.send(buffer);

	$("#message").val("");
	$("#message").focus();
}

function connect() {
	// Hack to work for local dev
	var prefix = "wss://"
	if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
		prefix = "ws://"
	}

	window.ws = new WebSocket(prefix + window.location.host + "/newclient/");

	window.ws.onopen = function() {
		ws.binaryType = "arraybuffer";
	};
	window.ws.onmessage = function(event) {
		var payload = msgpack.decode(new Uint8Array(event.data));
		$("#messages").append(payload.Message + "<br>")
	};
	window.ws.onclose = function() {
		connect();
	};

	waitForConnection(window.ws, function() {
		// window.history.pushState({}, null, window.location.origin + "/chat/" + window.room);
		$("#messages").append("Connected<br>")
	});
}

function waitForConnection(socket, callback){
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                if (callback != null){
                    callback();
                }
            } else {
                waitForConnection(socket, callback);
            }

        }, 5);
}