class Connection {
    constructor(room, name) {
        this._pingInterval = 1000;
        this._handlers = new Map();
        const prefix = dev ? "ws://" : "wss://";
        const endpoint = prefix + window.location.host + "/newclient/room=" + room + "&name=" + name;
        this.initWebSocket(endpoint);
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
    ping() {
        return defined(this._ping) ? this._ping : 0;
    }
    send(msg) {
        if (!this.canSend())
            return false;
        const buffer = msgpack.encode(msg);
        this._ws.send(buffer);
        return true;
    }
    canSend() { return this._ws.readyState === 1; }
    canReceive() { return this._ws.readyState == 1 && this._dc.readyState == "open"; }
    ready() { return this.canSend() && this.canReceive(); }
    initWebSocket(endpoint) {
        this._ws = new WebSocket(endpoint);
        this._ws.binaryType = "arraybuffer";
        this._ws.onopen = () => {
            debug("successfully connected to " + endpoint);
            this.addHandler(pingType, () => {
                this._ping = Date.now() - this._lastPingTime;
            });
            const self = this;
            function sendPing() {
                self.send({ T: pingType });
                self._lastPingTime = Date.now();
                setTimeout(sendPing, self._pingInterval);
            }
            ;
            sendPing();
            this.addHandler(answerType, (msg) => { this.setRemoteDescription(msg); });
            this.addHandler(candidateType, (msg) => { this.addIceCandidate(msg); });
            this.initWebRTC();
        };
        this._ws.onmessage = (event) => {
            this.handlePayload(event.data);
        };
        this._ws.onclose = () => {
            this._ws = null;
            this._wrtc = null;
        };
    }
    initWebRTC() {
        const config = {
            'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]
        };
        this._wrtc = new RTCPeerConnection(config);
        const dataChannelConfig = {
            ordered: false,
            maxRetransmits: 0
        };
        this._dc = this._wrtc.createDataChannel('data', dataChannelConfig);
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
            this._dc = event.channel;
            this._dc.onmessage = (event) => { this.handlePayload(event.data); };
        };
    }
    setRemoteDescription(msg) {
        const options = {
            type: "answer",
            sdp: msg.JSON["SDP"],
        };
        this._wrtc.setRemoteDescription(new RTCSessionDescription(options));
    }
    addIceCandidate(msg) {
        const options = {
            candidate: msg.JSON["Candidate"],
            sdpMid: msg.JSON["SDPMid"],
            sdpMLineIndex: msg.JSON["SDPMLineIndex"],
        };
        this._wrtc.addIceCandidate(new RTCIceCandidate(options));
    }
    handlePayload(payload) {
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
