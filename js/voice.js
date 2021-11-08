class Voice {
    constructor(connection, stream) {
        this._voiceOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
        };
        this._connection = connection;
        this._stream = stream;
        this._id = connection.id();
        this._joined = false;
        this._connection.addHandler(joinVoiceType, (msg) => { this.addVoice(msg); });
        this._connection.addHandler(leftType, (msg) => { this.removeVoice(msg); });
        this._connection.addHandler(leftVoiceType, (msg) => { this.removeVoice(msg); });
        this._connection.addHandler(voiceOfferType, (msg) => { this.processVoiceOffer(msg); });
        this._connection.addHandler(voiceAnswerType, (msg) => { this.processVoiceAnswer(msg); });
        this._connection.addHandler(voiceCandidateType, (msg) => { this.processVoiceCandidate(msg); });
        this._voice = new Map();
        this._voiceCandidates = new Map();
        this._audio = new Map();
    }
    joined() {
        return this._joined;
    }
    toggleVoice() {
        if (!this.joined()) {
            this._joined = true;
            this._stream.getTracks().forEach(track => track.enabled = true);
            this._connection.send({ T: joinVoiceType });
        }
        else {
            this._joined = false;
            this._stream.getTracks().forEach(track => track.enabled = false);
            this._voice.forEach((pc) => {
                pc.close();
            });
            this._voice.clear();
            this._audio.forEach((audio, id) => {
                elm("client-" + id).removeChild(audio);
            });
            this._audio.clear();
            this._connection.send({ T: leftVoiceType });
        }
    }
    addVoice(msg) {
        if (!this.joined()) {
            return;
        }
        const createPeerConnection = (id, sendOffer) => {
            const audioElement = document.createElement("audio");
            audioElement.id = "audio-" + id;
            audioElement.autoplay = true;
            audioElement.controls = true;
            this._audio.set(id, audioElement);
            elm("client-" + id).appendChild(audioElement);
            const pc = this._connection.newPeerConnection();
            this._voice.set(id, pc);
            this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
            pc.createOffer(this._voiceOfferOptions).then((description) => {
                return pc.setLocalDescription(description);
            }).then(() => {
                if (sendOffer) {
                    this._connection.send({ T: voiceOfferType, JSONPeer: { To: id, JSON: pc.localDescription.toJSON() } });
                }
            });
            pc.onicecandidate = (event) => {
                if (event && event.candidate) {
                    this._connection.send({ T: voiceCandidateType, JSONPeer: { To: id, JSON: event.candidate.toJSON() } });
                }
            };
            pc.onconnectionstatechange = () => {
                if (pc.connectionState == "disconnected") {
                    this.removeVoice({ Id: id });
                }
            };
            pc.ontrack = (event) => {
                audioElement.srcObject = event.streams[0];
            };
        };
        if (this._id != msg.Client.Id) {
            createPeerConnection(msg.Client.Id, false);
            return;
        }
        for (const [stringId, client] of Object.entries(msg.Clients)) {
            const id = Number(stringId);
            if (this._id == id)
                continue;
            createPeerConnection(id, true);
        }
    }
    removeVoice(msg) {
        if (this._id == msg.Client.Id) {
            return;
        }
        if (this._voice.has(msg.Client.Id)) {
            this._voice.get(msg.Client.Id).close();
            this._voice.delete(msg.Client.Id);
        }
        if (this._audio.has(msg.Client.Id)) {
            elm("audio").removeChild(this._audio.get(msg.Client.Id));
            this._audio.delete(msg.Client.Id);
        }
    }
    processVoiceOffer(msg) {
        const pc = this._voice.get(msg.From);
        const offer = msg.JSON;
        pc.setRemoteDescription(offer, () => {
            if (pc.remoteDescription.type == "offer") {
                pc.createAnswer().then((description) => {
                    return pc.setLocalDescription(description);
                }).then(() => {
                    this._connection.send({ T: voiceAnswerType, JSONPeer: { To: msg.From, JSON: pc.localDescription.toJSON() } });
                });
            }
        }, (e) => debug("Failed to set remote description from offer from " + msg.From + ": " + e));
    }
    processVoiceAnswer(msg) {
        const pc = this._voice.get(msg.From);
        const answer = msg.JSON;
        pc.setRemoteDescription(answer, () => { }, (e) => debug("Failed to set remote description from answer from " + msg.Client.Id + ": " + e));
        if (pc.remoteDescription && this._voiceCandidates.has(msg.From)) {
            this._voiceCandidates.get(msg.From).forEach((candidate) => {
                pc.addIceCandidate(candidate).then(() => { }, (e) => { debug("Failed to add candidate: " + e); });
            });
            this._voiceCandidates.delete(msg.From);
        }
    }
    processVoiceCandidate(msg) {
        const pc = this._voice.get(msg.From);
        const candidate = msg.JSON;
        if (!pc.remoteDescription) {
            if (!this._voiceCandidates.has(msg.From)) {
                this._voiceCandidates.set(msg.From, new Array());
            }
            this._voiceCandidates.get(msg.From).push(candidate);
            return;
        }
        pc.addIceCandidate(candidate).then(() => { }, (e) => { debug("Failed to add candidate: " + e); });
    }
}
