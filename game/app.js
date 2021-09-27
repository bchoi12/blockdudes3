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
		initWebRTC();
		startGame();
	};
	window.ws.onmessage = function(event) {
		var payload = msgpack.decode(new Uint8Array(event.data));
		handlePayload(payload)
	};
	window.ws.onclose = function() {
		debug("connection closed, opening a new one")
		delete window.ws;
		//connect();
	};
}

function initWebRTC() {
	function onIceCandidate(event){
		if (event && event.candidate) {
			sendPayload({T: candidateType, JSON: event.candidate.toJSON() });
		}
	}
	function onOfferCreated(description) {
		window.wrtc.setLocalDescription(description);
		sendPayload({T: offerType, JSON: description });
	}

	var config = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };
	window.wrtc = new RTCPeerConnection(config);
	const dataChannelConfig = { ordered: false, maxRetransmits: 0 };
	window.dataChannel = window.wrtc.createDataChannel('data', dataChannelConfig);
	const sdpConstraints = {
	    mandatory: {
	      OfferToReceiveAudio: false,
	      OfferToReceiveVideo: false,
	    },
	};
	window.wrtc.onicecandidate = onIceCandidate;
	window.wrtc.createOffer(onOfferCreated, () => {}, sdpConstraints);

	window.wrtc.ondatachannel = function(event) {
		function onMessage(event) {
			var payload = msgpack.decode(new Uint8Array(event.data));
			handlePayload(payload);
		}
		window.dataChannel = event.channel;
		window.dataChannel.onmessage = onMessage;
	}
}

function setRemoteDescription(payload) {
	var options = {
		type: "answer",
		sdp: payload.JSON["SDP"],
	}
	window.wrtc.setRemoteDescription(new RTCSessionDescription(options));
}

function addIceCandidate(payload) {
	var options = {
		candidate: payload.JSON["Candidate"],
		sdpMid: payload.JSON["SDPMid"],
		sdpMLineIndex: payload.JSON["SDPMLineIndex"],
	}
    window.wrtc.addIceCandidate(new RTCIceCandidate(options));
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

	switch(payload.T) {
		case pingType:
			debug(payload);
			recordPing(window.timing);
			break;

		case answerType:
			setRemoteDescription(payload);
			break;

		case candidateType:
			addIceCandidate(payload);
			break;

		case initType:
			initState(payload, window.game);
			break;

		case joinType:
		case leftType:
			updatePlayers(payload, window.game);
			break;

		case chatType:
			chat(payload.N + " #" + payload.Id, payload.M);
			break;

		case playerStateType:
			updatePlayerState(payload, window.game, window.timing);
			break;

		case objectInitType:
			initObjects(payload, window.game);
			break;

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