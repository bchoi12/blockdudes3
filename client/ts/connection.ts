import { encode, decode } from "@msgpack/msgpack"
import { Pinger } from './pinger.js'
import { LogUtil, Util } from './util.js'

type MessageHandler = (msg : any) => void;
type MessageSender = () => void;
class Connection {
	private readonly _iceConfig = {
    	"iceServers": [
			{
		      urls: "stun:openrelay.metered.ca:80",
		    },
		    {
		      urls: "turn:openrelay.metered.ca:80",
		      username: "openrelayproject",
		      credential: "openrelayproject",
		    },
		    {
		      urls: "turn:openrelay.metered.ca:443",
		      username: "openrelayproject",
		      credential: "openrelayproject",
		    },
		    {
		      urls: "turn:openrelay.metered.ca:443?transport=tcp",
		      username: "openrelayproject",
		      credential: "openrelayproject",
		    },
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

	constructor() {
		this._handlers = new Map();
		this._senders = new Map();
	}

	connect(room : string, name : string, socketSuccess : () => void, dcSuccess : () => void) : void {
		if (Util.defined(this._ws)) return;

		const prefix = Util.isDev() ? "ws://" : "wss://"
		const endpoint = prefix + window.location.host + "/newclient/room=" + room + "&name=" + name;
		this.initWebSocket(endpoint, socketSuccess, dcSuccess);
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

	id() : number {
		return Util.defined(this._id) ? this._id : -1;
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

	wsReady() : boolean {
		return Util.defined(this._ws) && this._ws.readyState == 1;
	}
	dcReady() : boolean {
		return Util.defined(this._dc) && this._dc.readyState == "open";
	}
	ready() : boolean {
		return Util.defined(this._id) && this.wsReady() && this.dcReady();
	}

	private initWebSocket(endpoint : string, socketSuccess : () => void, dcSuccess : () => void) : void {
		this._ws = new WebSocket(endpoint);
		this._ws.binaryType = "arraybuffer";

		this._ws.onopen = () => {
			console.log("Successfully created websocket");
			LogUtil.d("Successfully connected to " + endpoint);

			this.addHandler(initType, (msg : any) => {
				this._id = msg.Client.Id;
			});

			this.addHandler(answerType, (msg : any) => { this.setRemoteDescription(msg); });
			this.addHandler(candidateType, (msg : any) => { this.addIceCandidate(msg); });

			this._pinger = new Pinger();
			socketSuccess();
			this.initWebRTC(dcSuccess);
		};
		this._ws.onmessage = (event) => {	
			this.handlePayload(event.data);
		};
		this._ws.onerror = (event) => {
			console.error("Error when creating websocket!");
		};
		this._ws.onclose = (event) => {
			console.error("Websocket closed: " + event.reason);
		};
	}

	private initWebRTC(cb : () => void) : void {
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
			console.log("Successfully created data channel");
			this._dc = event.channel;
			this._dc.onmessage = (event) => { this.handlePayload(event.data); }	
			cb();
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
		const msg : any = decode(new Uint8Array(payload));

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