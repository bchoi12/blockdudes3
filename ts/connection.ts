type MessageHandler = (msg : any) => void;
type MessageSender = () => void;
class Connection {
	private readonly _iceConfig = {
    	"iceServers": [
	    	{
	    		urls: [
	                "stun:stun1.l.google.com:19302",
	                "stun:stun2.l.google.com:19302",
	    		]
	    	}
	    ]
    };

	private _handlers : Map<number, MessageHandler[]>;
	private _senders : Map<number, MessageSender>;

	private _room : string;
	private _name : string;
	private _id : number;

	private _ws : WebSocket;
	private _wrtc : RTCPeerConnection;
	private _dc : RTCDataChannel;
	private _candidates : Array<RTCIceCandidate>;
	private _pinger : Pinger;

	constructor(room : string, name : string) {
		this._handlers = new Map();
		this._senders = new Map();
		this._room = room;
		this._name = name;
	}

	connect() : void {
		if (defined(this._ws)) return;

		const prefix = dev ? "ws://" : "wss://"
		const endpoint = prefix + window.location.host + "/newclient/room=" + this._room + "&name=" + this._name;
		this.initWebSocket(endpoint);
		this._pinger = new Pinger(this);
	}

	newPeerConnection() : RTCPeerConnection {
		return new RTCPeerConnection(this._iceConfig);
	}

	addHandler(type : number, handler : MessageHandler) : boolean {
		if (this._handlers.has(type)) {
			this._handlers.get(type).push(handler);
		} else {
			this._handlers.set(type, [handler]);
		}

		return true;
	}

	addSender(type : number, sender : MessageSender, timeout : number) : boolean {
		if (this._senders.has(type)) {
			debug("sender for type " + type + " already exists");
			return false;
		}

		this._senders.set(type, sender);
		const loop = () => {
			if (!this._senders.has(type)) {
				return;
			}
			this._senders.get(type)();
			setTimeout(loop, timeout);
		};
		loop();
		return true;
	}

	deleteSender(type : number) : void {
		this._senders.delete(type);
	}

	id() : number {
		return this._id;
	}

	ping() : number {
		return this._pinger.ping();
	}

	send(msg : any) : boolean {
		if (!this.wsReady()) {
			debug("Trying to send message (type " + msg.T + ") before connection is ready!");
			return false;
		}

		const buffer = msgpack.encode(msg);
		this._ws.send(buffer);
		return true;
	}

	sendData(msg :any) : boolean {
		if (!this.dcReady()) {
			debug("Trying to send message (type " + msg.T + ") before data channel is ready!");
			return false;
		}

		const buffer = msgpack.encode(msg);
		this._dc.send(buffer);
		return true;
	}

	wsReady() : boolean {
		return defined(this._ws) && this._ws.readyState == 1;
	}
	dcReady() : boolean {
		return defined(this._dc) && this._dc.readyState == "open";
	}
	ready() : boolean {
		return defined(this._id) && this.wsReady() && this.dcReady();
	}

	private initWebSocket(endpoint : string) : void {
		this._ws = new WebSocket(endpoint);
		this._ws.binaryType = "arraybuffer";

		this._ws.onopen = () => {
			debug("successfully connected to " + endpoint);

			this.addHandler(initType, (msg : any) => {
				this._id = msg.Client.Id;
			});

			this.addHandler(answerType, (msg : any) => { this.setRemoteDescription(msg); });
			this.addHandler(candidateType, (msg : any) => { this.addIceCandidate(msg); });

			this.initWebRTC();
		};
		this._ws.onmessage = (event) => {	
			this.handlePayload(event.data)
		};
		this._ws.onclose = () => {
			debug("Websocket closed");
		};
	}

	private initWebRTC() : void {
		this._wrtc = new RTCPeerConnection(this._iceConfig);

		const dataChannelConfig = {
			ordered: false,
			maxRetransmits: 0
		};
		this._dc = this._wrtc.createDataChannel("data", dataChannelConfig);
		this._candidates = new Array<RTCIceCandidate>();

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
			debug("successfully created data channel");
			this._dc = event.channel;
			this._dc.onmessage = (event) => { this.handlePayload(event.data); }		
		};
	}

	private setRemoteDescription(msg : any) : void {
		const options = {
			type: "answer" as RTCSdpType,
			sdp: msg.JSON["SDP"],
		}
		this._wrtc.setRemoteDescription(new RTCSessionDescription(options));

		if (this._candidates.length > 0) {
			this._candidates.forEach((candidate) => {
				this._wrtc.addIceCandidate(candidate);
			});
			this._candidates.length = 0;
		}
	}

	private addIceCandidate(msg : any) : void {
		const options = {
			candidate: msg.JSON["Candidate"],
			sdpMid: msg.JSON["SDPMid"],
			sdpMLineIndex: msg.JSON["SDPMLineIndex"],
		}

		if (!this._wrtc.remoteDescription) {
			this._candidates.push(new RTCIceCandidate(options));
			return;
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