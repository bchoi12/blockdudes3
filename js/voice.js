class Voice {
    constructor(connection) {
        this._voiceOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
        };
        this._id = connection.id();
        this._connection = connection;
        this._connection.addHandler(joinVoiceType, (msg) => { this.updateVoice(msg); });
        this._connection.addHandler(clientOfferType, (msg) => { this.processVoiceOffer(msg); });
        this._connection.addHandler(clientAnswerType, (msg) => { this.processVoiceAnswer(msg); });
        this._connection.addHandler(clientCandidateType, (msg) => { this.processVoiceCandidate(msg); });
        this._voice = new Map();
        this._voiceCandidates = new Map();
    }
    join() {
        this._connection.send({ T: joinVoiceType });
    }
    leave() {
        this._connection.send({ T: leftVoiceType });
    }
    updateVoice(msg) {
        const createPeerConnection = (id) => {
            const pc = this._connection.newPeerConnection();
            this._voice.set(id, pc);
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            }).then((stream) => {
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            }).then(() => {
                if (this._id > id) {
                    pc.createOffer(this._voiceOfferOptions).then((description) => {
                        return pc.setLocalDescription(description);
                    }).then(() => {
                        this._connection.send({ T: clientOfferType, JSONId: { Id: this._id, JSON: pc.localDescription.toJSON() } });
                    });
                }
            }).catch((e) => {
                debug(e);
            });
            pc.onicecandidate = (event) => {
                if (event && event.candidate) {
                    this._connection.send({ T: clientCandidateType, JSONId: { Id: this._id, JSON: event.candidate.toJSON() } });
                }
            };
            pc.onconnectionstatechange = () => {
                if (pc.connectionState == "connected") {
                    debug("voice connected!");
                }
            };
            pc.ontrack = (event) => {
                elm("audio").srcObject = event.streams[0];
            };
        };
        if (this._id != msg.Id) {
            debug("voice: connect to new " + msg.Id);
            createPeerConnection(msg.Id);
            return;
        }
        for (const [stringId, client] of Object.entries(msg.Cs)) {
            const id = Number(stringId);
            if (this._id == id)
                continue;
            debug("voice: initialize " + id);
            createPeerConnection(id);
        }
    }
    processVoiceOffer(msg) {
        debug("Process offer for " + msg.Id + ", my ID=" + this._id);
        const pc = this._voice.get(msg.Id);
        const offer = msg.JSON;
        pc.setRemoteDescription(offer, () => {
            if (pc.remoteDescription.type == "offer") {
                pc.createAnswer().then((description) => {
                    return pc.setLocalDescription(description);
                }).then(() => {
                    this._connection.send({ T: clientAnswerType, JSONId: { Id: this._id, JSON: pc.localDescription.toJSON() } });
                });
            }
        }, () => debug("Failed to set offer"));
    }
    processVoiceAnswer(msg) {
        debug("Process answer for " + msg.Id + ", my ID=" + this._id);
        const pc = this._voice.get(msg.Id);
        const answer = msg.JSON;
        pc.setRemoteDescription(answer);
        if (pc.remoteDescription && this._voiceCandidates.has(msg.Id)) {
            this._voiceCandidates.get(msg.Id).forEach((candidate) => {
                pc.addIceCandidate(candidate).then(() => { }, (e) => { debug("Failed to add candidate: " + e); });
            });
            this._voiceCandidates.delete(msg.Id);
        }
    }
    processVoiceCandidate(msg) {
        const pc = this._voice.get(msg.Id);
        const candidate = msg.JSON;
        if (!pc.remoteDescription) {
            if (!this._voiceCandidates.has(msg.Id)) {
                this._voiceCandidates.set(msg.Id, new Array());
            }
            this._voiceCandidates.get(msg.Id).push(candidate);
            return;
        }
        pc.addIceCandidate(candidate).then(() => { }, (e) => { debug("Failed to add candidate: " + e); });
    }
}
