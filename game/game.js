const meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const staticMaterial = new THREE.MeshBasicMaterial( {color: 0x777777 } );

var playerStateUpdates = 0;

function startGame() {
	$("#div-login").css("display", "none");
	$("#div-game").css("display", "block");

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, renderWidth / renderHeight, 0.1, 1000 );
	camera.position.z = 5;
	renderer = new THREE.WebGLRenderer( {canvas: $("#renderer")[0]});
	renderer.setSize(renderWidth, renderHeight);

	var keys = new Set();
	function initKeyListeners(keys) {
		$(document).keydown(function(e) {
			e = e || window.event;

			if (e.keyCode === chatKeyCode) {
				sendChatMessage();
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

		function sendChatMessage() {
			if (!$("#message").is(":focus")) {
				if (keys.size > 0) {
					keys.clear();
					sendKeyMessage();
				}
				$("#message").focus();
				return;
			}

			if ($("#message").val().length === 0) {
				$("#message").blur();
				return;
			}

			if (typeof window.ws === 'undefined') {
				chat("Unable to send message, connection to server lost.");
				return;
			}

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
	initKeyListeners(keys);

	var animateFrames = 0;
	function animate() {
		renderer.render( scene, camera );
		animateFrames++;
		requestAnimationFrame( animate );
	}
	animate();

	function calcFps() {
		$("#fps").html("server @" + playerStateUpdates + " fps, drawing @" + animateFrames + " fps");
		playerStateUpdates = 0;
		animateFrames = 0;
		setTimeout(calcFps, 1000);
	}
	calcFps();

	return {
		id: invalidId,
		keys: keys,

		scene: scene,
		camera: camera,
		renderer: renderer,

		players: new Map(),
		playerRenders: new Map(),
		statics: [],
		staticRenders: [],
	}
}

function chat(m) {
	$("#messages").append("<span class='anim-blink'>" + m + "<br></span>");
	$("#div-messages").scrollTop($("#div-messages")[0].scrollHeight);
}

function initState(payload, game) {
	game.id = payload.Id;

	game.playerRenders.forEach(function(val, key, map) {
		game.scene.remove(val);
	})
	game.players.clear();
	game.playerRenders.clear();

	// Create all other players
	for (const id of payload.Ids) {
		newPlayer(id, game);
	}
}

function updatePlayers(payload, game) {
	var id = payload.Id;
	switch(payload.T) {
		case joinType:
			chat(payload.C.N + " #" + payload.Id + " just joined!")
			newPlayer(id, game);
			break;

		case leftType:
			chat(payload.C.N + " #" + payload.Id + " left")
			deletePlayer(id, game);
			break;
	}

	$("#people").html("People<br>");

	for (const id of payload.Ids) {
		var name = payload.Cs[id].N + " #" + id;
		var html = name;
		if (id === game.id) {
			html = "<span class='people-me'>" + html + "</span>";
		}
		html += "<br>";
		$("#people").append(html);
	}
}

function newPlayer(id, game) {
	game.players.set(id, {});

	game.playerRenders.set(id, new THREE.Mesh(new THREE.BoxGeometry(), id == game.id ? meMaterial : otherMaterial));
	game.scene.add(game.playerRenders.get(id));
}

function deletePlayer(id, game) {
	game.players.delete(id);

	game.scene.remove(game.playerRenders.get(id));
	game.playerRenders.delete(id);	
}

function updatePlayerState(payload, game) {
	playerStateUpdates++;

	for (const id of payload.Ids) {
		var p = payload.Ps[id];

		game.players.set(id, p);
		game.playerRenders.get(id).position.x = p.Pos.X;
		game.playerRenders.get(id).position.y = p.Pos.Y;
	}

	game.camera.position.x = game.playerRenders.get(game.id).position.x;
	game.camera.position.y = game.playerRenders.get(game.id).position.y;
}

function updateStaticState(payload, game) {
	for (const render of game.staticRenders) {
		game.scene.remove(render);
	}

	game.statics = payload.Ss;
	game.staticRenders = [];
	for (const s of game.statics) {
		var obj = new THREE.Mesh(new THREE.BoxGeometry(), staticMaterial);
		obj.position.x = s.Pos.X;
		obj.position.y = s.Pos.Y;
		game.staticRenders.push(obj);
		game.scene.add(obj);
	}

	debug(game.statics);
	debug(game.staticRenders);
}