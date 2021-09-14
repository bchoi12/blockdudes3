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
		if (defined(window.game)) {
			previewPlayers(window.game);
			updateCamera(window.game);
		}
		renderer.render(scene, camera);
		animateFrames++;

		requestAnimationFrame(animate);
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
		lastPlayerUpdate: Date.now(),
		playerRenders: new Map(),
		statics: [],
		staticRenders: [],
	}
}

function initState(payload, game) {
	game.id = payload.Id;

	game.playerRenders.forEach(function(render) {
		game.scene.remove(render);
	})
	game.players.clear();
	game.playerRenders.clear();
}

function updateClients(payload, game) {
	var id = payload.Id;
	switch(payload.T) {
		case joinType:
			chat(payload.C.N + " #" + payload.Id + " just joined!")
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

function deletePlayer(id, game) {
	game.players.delete(id);

	game.scene.remove(game.playerRenders.get(id));
	game.playerRenders.delete(id);	
}

function updatePlayerState(payload, game) {
	playerStateUpdates++;

	for (const id of payload.Ids) {
		var p = payload.Ps[id];

		if (!game.players.has(id)) {
			game.playerRenders.set(id, new THREE.Mesh(new THREE.BoxGeometry(), id == game.id ? meMaterial : otherMaterial));
			game.scene.add(game.playerRenders.get(id));
		}

		game.players.set(id, p);
		game.playerRenders.get(id).position.x = p.Pos.X;
		game.playerRenders.get(id).position.y = p.Pos.Y;
	}
	game.lastPlayerUpdate = Date.now();
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
}

function previewPlayers(game) {
	var timeStepSec = (Date.now() - game.lastPlayerUpdate) / 1000;
	if (timeStepSec > 0.1) return;

	game.playerRenders.forEach(function(render, id) {
		var player = game.players.get(id);
		render.position.x = player.Pos.X  + player.Vel.X * timeStepSec
		render.position.y = player.Pos.Y + player.Vel.Y * timeStepSec
	})	
}

function updateCamera(game) {
	if (game.id == invalidId) return; 
	if (!game.playerRenders.has(game.id)) return;

	window.game.camera.position.x = game.playerRenders.get(game.id).position.x;
	window.game.camera.position.y = game.playerRenders.get(game.id).position.y;
}