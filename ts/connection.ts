type MessageHandler = (msg : any) => void;
class Connection {
	private readonly _pingInterval = 1000;

	private _ping : number;
	private _lastPingTime : number;

	private _handlers : Map<number, MessageHandler[]>;

	private _ws : WebSocket;
	private _wrtc : RTCPeerConnection;
	private _dc : RTCDataChannel;

	constructor(room : string, name : string) {
		this._handlers = new Map();

		const prefix = dev ? "ws://" : "wss://"
		const endpoint = prefix + window.location.host + "/newclient/room=" + room + "&name=" + name;
		this.initWebSocket(endpoint);
	}

	addHandler(type : number, handler : MessageHandler) : boolean {
		if (this._handlers.has(type)) {
			this._handlers.get(type).push(handler);
		} else {
			this._handlers.set(type, [handler]);
		}

		return true;
	}

	ping() : number {
		return defined(this._ping) ? this._ping : 0;
	}

	send(msg : any) : boolean {
		if (!this.canSend()) return false;

		const buffer = msgpack.encode(msg);
		this._ws.send(buffer);
		return true;
	}

	canSend() : boolean { return this._ws.readyState === 1; }
	canReceive() : boolean { return this._ws.readyState == 1 && this._dc.readyState == "open"; }
	ready() : boolean { return this.canSend() && this.canReceive(); }

	private initWebSocket(endpoint : string) : void {
		this._ws = new WebSocket(endpoint);
		this._ws.binaryType = "arraybuffer";

		this._ws.onopen = () => {
			debug("successfully connected to " + endpoint);

			this.addHandler(pingType, () => {
				this._ping = Date.now() - this._lastPingTime;
			});

			const self = this;
			function sendPing() {
				// TODO: use data channel?
				self.send({T: pingType});
				self._lastPingTime = Date.now();
				setTimeout(sendPing, self._pingInterval);
			};
			sendPing();

			this.addHandler(answerType, (msg : any) => { this.setRemoteDescription(msg); });
			this.addHandler(candidateType, (msg : any) => { this.addIceCandidate(msg); });
			this.initWebRTC();
		};
		this._ws.onmessage = (event) => {	
			this.handlePayload(event.data)
		};
		this._ws.onclose = () => {
			this._ws = null;
			this._wrtc = null;
		};
	}

	private initWebRTC() : void {
	    const config = {
	    	'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]
	    };
		this._wrtc = new RTCPeerConnection(config);

		const dataChannelConfig = {
			ordered: false,
			maxRetransmits: 0
		};
		this._dc = this._wrtc.createDataChannel('data', dataChannelConfig);

		this._wrtc.onicecandidate = (event) => {
			if (event && event.candidate) {
				this.send({T: candidateType, JSON: event.candidate.toJSON() });
			}		
		};

		this._wrtc.createOffer((description) => {
			this._wrtc.setLocalDescription(description);
			this.send({ T: offerType, JSON: description });			
		}, () => {});

		this._wrtc.ondatachannel = (event) => {
			this._dc = event.channel;
			this._dc.onmessage = (event) => {this.handlePayload(event.data); }		
		};
	}

	private setRemoteDescription(msg : any) : void {
		const options = {
			type: "answer" as RTCSdpType,
			sdp: msg.JSON["SDP"],
		}
		this._wrtc.setRemoteDescription(new RTCSessionDescription(options));
	}

	private addIceCandidate(msg : any) : void {
		const options = {
			candidate: msg.JSON["Candidate"],
			sdpMid: msg.JSON["SDPMid"],
			sdpMLineIndex: msg.JSON["SDPMLineIndex"],
		}
	    this._wrtc.addIceCandidate(new RTCIceCandidate(options));
	}

	private handlePayload(payload : any) {
		const msg = msgpack.decode(new Uint8Array(payload));

		if (!defined(msg.T)) {
			debug("Error! Missing type for payload");
			return;
		}

		if (!this._handlers.has(msg.T)) {
			debug("Error! Missing handler for type " + msg.T);
			return;
		}

		this._handlers.get(msg.T).forEach((handler) => { handler(msg); });
	}
}