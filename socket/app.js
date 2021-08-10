$( document ).ready(function() {
	$("#send").click(function() {
		connect()
	});
});

function connect() {
	window.ws = new WebSocket("ws://" + window.location.host + "/connection/");

	window.ws.onmessage = function(event) {
		console.log("got a message")
	}
	window.ws.onclose = function() {
		connect();
	};

	waitForConnection(window.ws, function() {
		// window.history.pushState({}, null, window.location.origin + "/chat/" + window.room);
		window.ws.send("data", {binary : true});
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