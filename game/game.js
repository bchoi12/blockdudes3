const meMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const otherMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const objectMaterial = new THREE.MeshBasicMaterial( {color: 0x777777 } );

function startGame() {
	$("#div-login").css("display", "none");
	$("#div-game").css("display", "block");

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, $("#renderer").width() / $("#renderer").height(), 0.1, 1000 );
	var renderer = new THREE.WebGLRenderer( {canvas: $("#renderer")[0]});
	renderer.setClearColor(0xffffff);
	camera.position.z = 5;

	window.game = {
		id: invalidId,
		keys: new Set(),

		scene: scene,
		camera: camera,
		renderer: renderer,

		players: new Map(),
		playerRenders: new Map(),
		objects: new Map(),
		objectRenders: new Map(),		
	};
	window.timing = {
		ping: 0,
		lastPing: Date.now(),

		animateFrames: 0,

		serverUpdates: 0,	// delete later
		lastUpdate: Date.now(),
		intervalDiff: 0,
	};

	function resizeCanvas() {
		var width = $(window).width();
		var height = $(window).height();
		
		$("#renderer").width(width).height(height);
		renderer.setSize(width, height);

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		$("#messages").css("bottom", ($("#form-send-message").height()+4) + "px");
		$("#message-box").css("width", $("#messages").width() + "px");
	}
	resizeCanvas();
	$(window).resize(resizeCanvas);

	function initKeyListeners() {
		var keys = window.game.keys;
		$(document).keydown(function(e) {
			e = e || window.event;

			if (e.keyCode === chatKeyCode) {
				sendChatMessage();
				return;
			}

			if (!keyMap.has(e.keyCode)) {
				return;
			}
			if ($("#message-box").is(":focus")) {
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
			if ($("#message-box").is(":focus")) {
				return;
			}

			var key = keyMap.get(e.keyCode);
			if (keys.has(key)) {
				keys.delete(key);
				sendKeyMessage();
			}
		});

		function sendChatMessage() {
			function showChat() {
				$("#messages").removeClass("chat-hide");
				$("#messages").removeClass("no-select");
				$("#form-send-message").css("display", "block");
				$("#message-box").focus();
			}
			function hideChat() {
				$("#messages").addClass("chat-hide");
				$("#messages").addClass("no-select");
				$("#form-send-message").css("display", "none");
				$("#message-box").blur();
			}

			if ($("#messages").hasClass("chat-hide")) {
				if (keys.size > 0) {
					keys.clear();
					sendKeyMessage();
				}
				showChat();
				return;
			}

			if ($("#message-box").val().length === 0) {
				hideChat();
				return;
			}

			if (typeof window.ws === 'undefined') {
				gameMessage("Unable to send message, connection to server lost.");
				return;
			}

			var payload = {T: chatType, Chat: {
				M: $("#message-box").val().trim(),
			}}

			if (sendPayload(payload)) {
				$("#message-box").val("");
				hideChat();
			} else {
				gameMessage("Failed to send chat message!");
			}
		}
		function sendKeyMessage() {
			sendPayload({T: keyType, Key: {K: Array.from(keys) }});
		}
	}
	initKeyListeners();

	function animate() {
		previewPlayers(window.game, window.timing);
		updateCamera(window.game);
		renderer.render(scene, camera);
		window.timing.animateFrames++;

		requestAnimationFrame(animate);
	}
	animate();

	function updateTimings(timing) {
		$("#fps").text("Ping: " + window.timing.ping + " | Diff: " + window.timing.intervalDiff + " | UPS: " + window.timing.serverUpdates + " | FPS: " + window.timing.animateFrames);

		sendPayload({T: pingType });
		window.timing.lastPing = Date.now();
		window.timing.serverUpdates = 0;
		window.timing.animateFrames = 0;
		setTimeout(updateTimings, 1000);
	}
	updateTimings();
}

function initState(payload, game) {
	game.id = "" + payload.Id;

	game.playerRenders.forEach(function(render) {
		game.scene.remove(render);
	})
	game.players.clear();
	game.playerRenders.clear();
}

function updatePlayers(payload, game) {
	var id = "" + payload.Id;
	switch(payload.T) {
		case joinType:
			gameMessage(payload.C.N + " #" + id + " just joined!")
			break;

		case leftType:
			gameMessage(payload.C.N + " #" + id + " left")
			deletePlayer(id, game);
			break;
	}

	$("#people").html("");
	for (let [id, client] of Object.entries(payload.Cs)) {
		var name = client.N + " #" + id;
		var html = id == game.id ? $("<span class='people-me'></span>") : $("<span></span>");
		html.text(name)
		$("#people").append(html);
		$("#people").append("<br>");
	}
}

function deletePlayer(id, game) {
	game.players.delete(id);

	game.scene.remove(game.playerRenders.get(id));
	game.playerRenders.delete(id);	
}

function updatePlayerState(payload, game, timing) {
	for (let [id, p] of Object.entries(payload.Ps)) {
		if (!game.players.has(id)) {
			game.playerRenders.set(id, new THREE.Mesh(new THREE.BoxGeometry(), id == game.id ? meMaterial : otherMaterial));
			game.scene.add(game.playerRenders.get(id));
		}

		game.players.set(id, p);
		game.playerRenders.get(id).position.x = p.Pos.X;
		game.playerRenders.get(id).position.y = p.Pos.Y;
	}
	timing.serverUpdates++;
	timing.intervalDiff = Math.max((Date.now() - timing.lastUpdate) - payload.Int, 0);
	timing.lastUpdate = Date.now();
}

function initObjects(payload, game) {
	for (const render of game.objectRenders) {
		game.scene.remove(render);
	}
	game.objects.clear();
	game.objectRenders.clear();

	for (let [id, object] of Object.entries(payload.Os)) {
		game.objects.set(id, object);

		var mesh = new THREE.Mesh(new THREE.BoxGeometry(), objectMaterial);
		mesh.position.x = object.Pos.X;
		mesh.position.y = object.Pos.Y;
		game.objectRenders.set(id, mesh);
		game.scene.add(mesh);
	}
}

function previewPlayers(game, timing) {
	var timeStepSec = (Date.now() - (timing.lastUpdate - timing.intervalDiff)) / 1000;
	if (timeStepSec > 0.3) return;

	game.playerRenders.forEach(function(render, id) {
		var player = game.players.get(id);
		render.position.x = player.Pos.X  + player.Vel.X * timeStepSec + 0.5 * player.Acc.X * timeStepSec * timeStepSec
		render.position.y = player.Pos.Y + player.Vel.Y * timeStepSec + 0.5 * player.Acc.X * timeStepSec * timeStepSec
	})	
}

function updateCamera(game) {
	if (game.id == invalidId) return; 
	if (!game.playerRenders.has(game.id)) return;

	game.camera.position.x = game.playerRenders.get(game.id).position.x;
	game.camera.position.y = game.playerRenders.get(game.id).position.y;
}

function gameMessage(message) {
	chat("", message);
}
function recordPing(timing) {
	timing.ping = Date.now() - timing.lastPing;
}

function requestFullScreen() {
	var canvas = document.getElementById("renderer");

	canvas.requestFullScreen = canvas.requestFullScreen || canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen;
	canvas.requestFullScreen();
}

function pointerLock() {
	var canvas = document.getElementById("renderer");
	canvas.requestPointerLock = canvas.requestPointerLock ||
		     canvas.mozRequestPointerLock ||
		     canvas.webkitRequestPointerLock;
	canvas.requestPointerLock();
}

function pointerUnlock() {
	document.exitPointerLock = document.exitPointerLock ||
				   document.mozExitPointerLock ||
				   document.webkitExitPointerLock;
	document.exitPointerLock();	
}