import { encode, decode } from "@msgpack/msgpack";
import { Pinger } from './pinger.js';
import { LogUtil, Util } from './util.js';
class Connection {
    constructor() {
        this._iceConfig = {
            "iceServers": [
                {
                    urls: [
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                    ]
                }
            ]
        };
        this._handlers = new Map();
        this._senders = new Map();
    }
    connect(room, name, socketSuccess, dcSuccess) {
        if (Util.defined(this._ws))
            return;
        const prefix = Util.isDev() ? "ws://" : "wss://";
        const endpoint = prefix + window.location.host + "/newclient/room=" + room + "&name=" + name;
        this.initWebSocket(endpoint, socketSuccess, dcSuccess);
    }
    addHandler(type, handler) {
        if (this._handlers.has(type)) {
            this._handlers.get(type).push(handler);
        }
        else {
            this._handlers.set(type, [handler]);
        }
        return true;
    }
    addSender(type, sender, timeout) {
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
    deleteSender(type) {
        this._senders.delete(type);
    }
    id() {
        return Util.defined(this._id) ? this._id : -1;
    }
    ping() {
        if (!Util.defined(this._pinger)) {
            return 0;
        }
        return this._pinger.ping();
    }
    send(msg) {
        if (!this.wsReady()) {
            LogUtil.d("Trying to send message (type " + msg.T + ") before connection is ready!");
            return false;
        }
        const buffer = encode(msg);
        this._ws.send(buffer);
        return true;
    }
    sendData(msg) {
        if (!this.dcReady()) {
            LogUtil.d("Trying to send message (type " + msg.T + ") before data channel is ready!");
            return false;
        }
        const buffer = encode(msg);
        this._dc.send(buffer);
        return true;
    }
    wsReady() {
        return Util.defined(this._ws) && this._ws.readyState == 1;
    }
    dcReady() {
        return Util.defined(this._dc) && this._dc.readyState == "open";
    }
    ready() {
        return Util.defined(this._id) && this.wsReady() && this.dcReady();
    }
    initWebSocket(endpoint, socketSuccess, dcSuccess) {
        this._ws = new WebSocket(endpoint);
        this._ws.binaryType = "arraybuffer";
        this._ws.onopen = () => {
            console.log("Successfully created websocket");
            LogUtil.d("Successfully connected to " + endpoint);
            this.addHandler(initType, (msg) => {
                this._id = msg.Client.Id;
            });
            this.addHandler(answerType, (msg) => { this.setRemoteDescription(msg); });
            this.addHandler(candidateType, (msg) => { this.addIceCandidate(msg); });
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
    initWebRTC(cb) {
        this._wrtc = new RTCPeerConnection(this._iceConfig);
        const dataChannelConfig = {
            ordered: false,
            maxRetransmits: 0
        };
        this._dc = this._wrtc.createDataChannel("data", dataChannelConfig);
        this._candidates = new Array();
        this._wrtc.onicecandidate = (event) => {
            if (event && event.candidate) {
                this.send({ T: candidateType, JSON: event.candidate.toJSON() });
            }
        };
        this._wrtc.createOffer((description) => {
            this._wrtc.setLocalDescription(description);
            this.send({ T: offerType, JSON: description });
        }, () => { });
        this._wrtc.ondatachannel = (event) => {
            console.log("Successfully created data channel");
            this._dc = event.channel;
            this._dc.onmessage = (event) => { this.handlePayload(event.data); };
            cb();
        };
    }
    setRemoteDescription(msg) {
        const options = {
            type: "answer",
            sdp: msg.JSON["SDP"],
        };
        this._wrtc.setRemoteDescription(new RTCSessionDescription(options));
        if (this._candidates.length > 0) {
            this._candidates.forEach((candidate) => {
                this._wrtc.addIceCandidate(candidate);
            });
            this._candidates.length = 0;
        }
    }
    addIceCandidate(msg) {
        const options = {
            candidate: msg.JSON["Candidate"],
            sdpMid: msg.JSON["SDPMid"],
            sdpMLineIndex: msg.JSON["SDPMLineIndex"],
        };
        if (!this._wrtc.remoteDescription) {
            this._candidates.push(new RTCIceCandidate(options));
            return;
        }
        this._wrtc.addIceCandidate(new RTCIceCandidate(options));
    }
    handlePayload(payload) {
        const msg = decode(new Uint8Array(payload));
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
