$( document ).ready(function() {
	connect();

	$("#send").click(function() {
		if (typeof window.ws === 'undefined') {
			return;
		}

		var payload = {T: 1, Chat: {
			M: $("#message").val().trim(),
		}}
		sendMessage(payload);
	});
});

function connect() {
	var prefix = dev ? "ws://" : "wss://"
	window.ws = new WebSocket(prefix + window.location.host + "/newclient/");

	window.ws.onopen = function() {
		ws.binaryType = "arraybuffer";
		debug("connected");
		$("#messages").append("Connected<br>")
	};
	window.ws.onmessage = function(event) {
		debug("RECEIVED EVENT")
		debug(event)
		var payload = msgpack.decode(new Uint8Array(event.data));
		handlePayload(payload)
	};
	window.ws.onclose = function() {
		debug("connection closed, opening a new one")
		connect();
	};

	/*
	waitUntilTrue(function () { return window.ws.readyState === 1; }, 5, function() {
		// window.history.pushState({}, null, window.location.origin + "/chat/" + window.room);
	});
	*/
}

function handlePayload(payload) {
	debug("PARSING PAYLOAD")
	debug(payload);

	if (typeof payload.T === 'undefined') {
		console.log("Error! Missing type for payload");
		return;
	}

	switch(payload.T) {
		case 1:
			$("#messages").append(payload.M + "<br>");
			break;

		case 2:
			$("#messages").append("slide to " + payload.X + "<br>");
			return;

		default:
			console.log("Error, unknown type " + payload.T)
			return
	}
}

function sendMessage(payload) {
	debug("SENDING PAYLOAD")
	debug(payload)

	var buffer = msgpack.encode(payload);
	window.ws.send(buffer);

	$("#message").val("");
	$("#message").focus();
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
$("body").append( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

const animate = function () {
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
	requestAnimationFrame( animate );
};

animate();

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
    }
    else if (e.keyCode == '40') {
        // down arrow
    }
    else if (e.keyCode == '37') {
       cube.position.x -= 0.1;
    }
    else if (e.keyCode == '39') {
       cube.position.x += 0.1;
    } else {
    	return;
    }

    sendMessage({T: 2, Pos: {X: cube.position.x, Y: 0}})
}
