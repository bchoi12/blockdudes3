var scene, camera, renderer;
$( document ).ready(function() {
	var width = $(document).width();
	var height = $(document).height();

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
	camera.position.z = 5;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	$("body").append( renderer.domElement );

	connect();

	$("#send").click(function() {
		if (typeof window.ws === 'undefined') {
			return;
		}

		var payload = {T: chatType, Chat: {
			M: $("#message").val().trim(),
		}}
		sendMessage(payload);
	});

	const animate = function () {
		renderer.render( scene, camera );
		requestAnimationFrame( animate );
	};
	animate();
});

function connect() {
	var prefix = dev ? "ws://" : "wss://"
	window.ws = new WebSocket(prefix + window.location.host + "/newclient/");

	window.ws.onopen = function() {
		ws.binaryType = "arraybuffer";
		chat("Connected!");
	};
	window.ws.onmessage = function(event) {
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


var keys = new Set();
$(document).keydown(function(e) {
	e = e || window.event;

	if (!keyMap.has(e.keyCode)) {
		return;
	}

	var key = keyMap.get(e.keyCode);
	if (!keys.has(key)) {
		keys.add(key);
		sendMessage({T: keyType, Key: { K: getKeys() }});
	}
});

$(document).keyup(function(e) {
	e = e || window.event;

	if (!keyMap.has(e.keyCode)) {
		return;
	}

	var key = keyMap.get(e.keyCode);
	if (keys.has(key)) {
		keys.delete(key);
		sendMessage({T: keyType, Key: {K: getKeys() }});
	}
});

function getKeys() {
	return Array.from(keys);
}

function handlePayload(payload) {
	if (typeof payload.T === 'undefined') {
		debug("Error! Missing type for payload");
		return;
	}

	switch(payload.T) {
		case initType:
			initPlayers(payload);
			break;

		case joinType:
		case leftType:
			updatePlayers(payload);
			break;

		case chatType:
			chat(payload.M);
			break;

		case stateType:
			updateState(payload);
			return;

		default:
			debug("Error, unknown type " + payload.T)
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

function chat(m) {
	$("#messages").append(m + "<br>");
}

const players = new Map();
const playerRenders = new Map();
const geometry = new THREE.BoxGeometry();
const meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

var myId;
function initPlayers(payload) {
	myId = payload.Id;
	chat("Your ID is " + payload.Id + ", all IDs: " + payload.Ids)
	while(scene.children.length > 0){ 
    	scene.remove(scene.children[0]); 
	}
	players.clear();
	playerRenders.clear();
	for (const id of payload.Ids) {
		newPlayer(id);
	}
}

function updatePlayers(payload) {
	var id = payload.Id;
	switch(payload.T) {
		case joinType:
			chat("New client with ID " + payload.Id + ", all IDs: " + payload.Ids)
			newPlayer(id);
			break;

		case leftType:
			chat("Client with ID " + payload.Id + " left, all IDs: " + payload.Ids)
			players.delete(id);
			scene.remove(playerRenders.get(id));
			playerRenders.delete(id);
			break;
	}
}

function newPlayer(id) {
	players.set(id, {});
	playerRenders.set(id, new THREE.Mesh(geometry, id == myId ? meMaterial : otherMaterial));
	scene.add(playerRenders.get(id));
}

function updateState(payload) {
	for (const p of payload.P) {
		players.set(p.Id, p);
		playerRenders.get(p.Id).position.x = p.Pos.X;
		playerRenders.get(p.Id).position.y = p.Pos.Y;
		playerRenders.get(p.Id).rotation.x += p.Vel.X / 100;
		playerRenders.get(p.Id).rotation.y += p.Vel.Y / 100;
	}
}