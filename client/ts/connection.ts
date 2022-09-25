import { encode, decode } from "@msgpack/msgpack"
import { Pinger } from './pinger.js'
import { PerSecondTracker } from './tracker.js'
import { ui } from './ui.js'
import { LogUtil, Util } from './util.js'

type MessageHandler = (msg : any) => void;
type MessageSender = () => void;
class Connection {
	private readonly _iceConfig = {
    	"iceServers": [
	    	{
	    		urls: [
	                "stun:stun1.l.google.com:19302",
	                "stun:stun2.l.google.com:19302",
					"stun:openrelay.metered.ca:80",
	    		]
	    	}
	    ]
    };

	private _handlers : Map<number, MessageHandler[]>;
	private _senders : Map<number, MessageSender>;

	private _id : number;

	private _ws : WebSocket;
	private _wrtc : RTCPeerConnection;
	private _dc : RTCDataChannel;
	private _candidates : Array<RTCIceCandidate>;
	private _pinger : Pinger;

	private _dataTracker : PerSecondTracker;

	constructor() {
		this._handlers = new Map();
		this._senders = new Map();

		this._dataTracker = new PerSecondTracker();
	}

	setup() : void {
		this.addHandler(initType, (msg : any) => {
			this._id = msg.Client.Id;
			LogUtil.d("Initialized connection with id " + this._id);
		});
		this.addHandler(answerType, (msg : any) => { this.setRemoteDescription(msg); });
		this.addHandler(candidateType, (msg : any) => { this.addIceCandidate(msg); });
	}

	hasId() : boolean { return Util.defined(this._id) && this._id >= 0; }
	id() : number { return this.hasId() ? this._id : -1; }
	wsConnecting() : boolean { return Util.defined(this._ws) && (this._ws.readyState === 0 || this._ws.readyState === 1); }
	wsReady() : boolean { return Util.defined(this._ws) && this._ws.readyState === 1; }
	dcConnecting() : boolean { return Util.defined(this._dc) && (this._dc.readyState === "connecting" || this._dc.readyState === "open"); }
	dcReady() : boolean { return Util.defined(this._dc) && this._dc.readyState === "open"; }
	ready() : boolean { return Util.defined(this._id) && this.wsReady() && this.dcReady(); }

	connect(vars : Map<string, string>, socketSuccess : () => void, dcSuccess : () => void) : void {
		const prefix = Util.isDev() ? "ws://" : "wss://";
		const server = Util.isDev() ? "localhost:8080" : window.location.host.includes("herokuapp") ? window.location.host : "blockdudes3.uc.r.appspot.com";
		let endpoint = prefix + server + "/bd3/"
		console.log("Using endpoint " + endpoint);
		for (const [key, value] of vars) {
			endpoint += key + "=" + value + "&";
		}
		if (endpoint.endsWith("&")) {
			endpoint = endpoint.slice(0, -1);
		}

		this.initWebSocket(endpoint, socketSuccess, dcSuccess);
	}

	disconnect() : void { this._ws.close(); }
	disconnectWebRTC() : void { this._wrtc.close(); }

	addHandler(type : number, handler : MessageHandler) : boolean {
		// TODO: do we ever want to delete handlers? maybe they should be unique to a class
		if (this._handlers.has(type)) {
			this._handlers.get(type).push(handler);
		} else {
			this._handlers.set(type, [handler]);
		}

		return true;
	}

	addSender(type : number, sender : MessageSender, timeout : number) : boolean {
		if (this._senders.has(type)) {
			LogUtil.d("sender for type " + type + " already exists");
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

	bytesPerSecond() : number {
		return this._dataTracker.flush();
	}

	ping() : number {
		if (!Util.defined(this._pinger)) {
			return 0;
		}
		return this._pinger.ping();
	}

	send(msg : any) : boolean {
		if (!this.wsReady()) {
			LogUtil.d("Trying to send message (type " + msg.T + ") before connection is ready!");
			return false;
		}

		const buffer = encode(msg);
		this._ws.send(buffer);
		return true;
	}

	sendData(msg :any) : boolean {
		if (!this.dcReady()) {
			LogUtil.d("Trying to send message (type " + msg.T + ") before data channel is ready!");
			return false;
		}

		const buffer = encode(msg);
		this._dc.send(buffer);
		return true;
	}

	private initWebSocket(endpoint : string, socketSuccess : () => void, dcSuccess : () => void) : void {
		if (this.wsReady() && !this.dcConnecting()) {
			this.initWebRTC(dcSuccess);
			return;
		}

		if (this.wsConnecting()) {
			return;
		}

		this._ws = new WebSocket(endpoint);
		this._ws.binaryType = "arraybuffer";

		this._ws.onopen = () => {
			console.log("Successfully created websocket");
			LogUtil.d("Successfully connected to " + endpoint);

			if (!Util.defined(this._pinger)) {
				this._pinger = new Pinger();
			}
			socketSuccess();		
			this.initWebRTC(dcSuccess);
		};
		this._ws.onmessage = (event) => {	
			this.handlePayload(event.data);
		};
		this._ws.onclose = (event) => {
			console.error("Websocket closed!");
			if (Util.defined(this._wrtc)) {
				this._wrtc.close();
			}
			if (Util.defined(this._dc)) {
				this._dc.close();
			}
			ui.disconnected();
		};
	}

	private initWebRTC(dcSuccess : () => void) : void {
		if (Util.defined(this._wrtc)) {
			this._wrtc.close();
		}
		this._wrtc = new RTCPeerConnection(this._iceConfig);

		const dataChannelConfig = {
			ordered: false,
			maxRetransmits: 0
		};

		if (Util.defined(this._dc)) {
			this._dc.close();
		}
		this._dc = this._wrtc.createDataChannel("data", dataChannelConfig);
		this._candidates = new Array<RTCIceCandidate>();

		this._wrtc.onconnectionstatechange = (event) => {
			LogUtil.d("WebRTC connection state changed: " + this._wrtc.connectionState);
		};

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
			console.log("Successfully created data channel");
			this._dc = event.channel;
			this._dc.onmessage = (event) => { this.handlePayload(event.data); }
			this._dc.onclose = (event) => { this._ws.close(); }
			dcSuccess();
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
		const bytes = new Uint8Array(payload);
		const msg : any = decode(bytes);

		if (Util.isDev()) {
			this._dataTracker.add(bytes.length);
		}

		if (!Util.defined(msg.T)) {
			LogUtil.d("Error! Missing type for payload");
			return;
		}

		if (!this._handlers.has(msg.T)) {
			LogUtil.d("Error! Missing handler for type " + msg.T);
			return;
		}

		this._handlers.get(msg.T).forEach((handler) => { handler(msg); });
	}
}

export const connection = new Connection();