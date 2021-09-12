const meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

function startGame() {
	$("#div-login").css("display", "none");
	$("#div-game").css("display", "block");

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, renderWidth / renderHeight, 0.1, 1000 );
	camera.position.z = 5;
	renderer = new THREE.WebGLRenderer( {canvas: $("#game")[0]});
	renderer.setSize(renderWidth, renderHeight);

	var keys = new Set();
	initKeyListeners(keys);

	function animate() {
		renderer.render( scene, camera );
		requestAnimationFrame( animate );
	}
	animate();

	return {
		id: -1,
		keys: keys,

		scene: scene,
		camera: camera,
		renderer: renderer,

		players: new Map(),
		playerRenders: new Map(),
	}
}

function chat(m) {
	$("#messages").append(m + "<br>");
}

function initState(payload, game) {
	game.id = payload.Id;
	while(game.scene.children.length > 0){ 
    	game.scene.remove(scene.children[0]); 
	}
	game.players.clear();
	game.playerRenders.clear();

	// Create all other players
	for (const id of payload.Ids) {
		if (id === game.id) {
			debugDiv("received my own ID during init");
			continue;
		}
		newPlayer(id, game);
	}
}

function updatePlayers(payload, game) {
	var id = payload.Id;
	switch(payload.T) {
		case joinType:
			chat(payload.C.N + " (" + payload.Id + ") just joined!")
			newPlayer(id, game);
			break;

		case leftType:
			chat(payload.C.N + " (" + payload.Id + ") left")
			deletePlayer(id, game);
			break;
	}

	$("#people").html("People<br>");

	for (const id of payload.Ids) {
		var player = payload.Cs[id];
		$("#people").append(player.N + " (" + id + ")<br>");
	}
}

function newPlayer(id, game) {
	game.players.set(id, {});
	game.playerRenders.set(id, new THREE.Mesh(new THREE.BoxGeometry(), id == game.id ? meMaterial : otherMaterial));
	game.scene.add(game.playerRenders.get(id));
}

function deletePlayer(id, game) {
	game.players.delete(id);
	game.scene.remove(playerRenders.get(id));
	game.playerRenders.delete(id);	
}

function updateState(payload, game) {
	for (const p of payload.P) {
		game.players.set(p.Id, p);
		game.playerRenders.get(p.Id).position.x = p.Pos.X;
		game.playerRenders.get(p.Id).position.y = p.Pos.Y;
		game.playerRenders.get(p.Id).rotation.x += p.Vel.Y / 100;
		game.playerRenders.get(p.Id).rotation.y += p.Vel.X / 100;
	}
}

function initKeyListeners(keys) {
	$(document).keydown(function(e) {
		e = e || window.event;

		if (e.keyCode === 13) {
			if ($("#message").is(":focus")) return;

			if (keys.size > 0) {
				keys.clear();
				sendKeyMessage();
			}
			$("#message").focus();
			return;
		}

		if (!keyMap.has(e.keyCode)) {
			return;
		}
		if ($("#message").is(":focus")) {
			return;
		}

		var key = keyMap.get(e.keyCode);
		if (!keys.has(key)) {
			keys.add(key);
			sendKeyMessage();
		}
	});

	$(document).keyup(function(e) {
		e = e || window.event;

		if (!keyMap.has(e.keyCode)) {
			return;
		}
		if ($("#message").is(":focus")) {
			return;
		}

		var key = keyMap.get(e.keyCode);
		if (keys.has(key)) {
			keys.delete(key);
			sendKeyMessage();
		}
	});

	$("#form-send-message").submit(function() {
		if (typeof window.ws === 'undefined') {
			chat("Unable to send message, connection to server lost.");
			return;
		}

		sendChatMessage();
	});

	function sendChatMessage() {
		var payload = {T: chatType, Chat: {
			M: $("#message").val().trim(),
		}}

		if (sendPayload(payload)) {
			$("#message").val("");
			$("#message").blur();
		} else {
			chat("Failed to send chat message!");
		}
	}
	function sendKeyMessage() {
		sendPayload({T: keyType, Key: {K: Array.from(keys) }});
	}
}