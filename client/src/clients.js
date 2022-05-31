import { LogUtil, HtmlUtil, Util } from './util.js';
import { connection } from './connection.js';
export class Clients {
    constructor() {
        this._voiceOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
        };
        this._enabled = false;
        this._voice = new Map();
        this._voiceCandidates = new Map();
        this._audio = new Map();
    }
    enabled() {
        return this._enabled;
    }
    setup() {
        connection.addHandler(joinVoiceType, (msg) => { this.addVoice(msg); });
        connection.addHandler(leftType, (msg) => { this.removeVoice(msg); });
        connection.addHandler(leftVoiceType, (msg) => { this.removeVoice(msg); });
        connection.addHandler(voiceOfferType, (msg) => { this.processVoiceOffer(msg); });
        connection.addHandler(voiceAnswerType, (msg) => { this.processVoiceAnswer(msg); });
        connection.addHandler(voiceCandidateType, (msg) => { this.processVoiceCandidate(msg); });
    }
    toggleVoice() {
        if (!connection.ready()) {
            return;
        }
        if (!this.enabled()) {
            this._enabled = true;
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            }).then((stream) => {
                this._stream = stream;
                this._stream.getTracks().forEach(track => track.enabled = true);
                connection.send({ T: joinVoiceType });
            }).catch((e) => {
                this._enabled = false;
                LogUtil.d("Failed to enable voice chat: " + e);
            });
        }
        else {
            this._stream.getTracks().forEach(track => track.stop());
            this._voice.forEach((pc) => {
                pc.close();
            });
            this._voice.clear();
            this._audio.forEach((audio, id) => {
                HtmlUtil.elm("client-" + id).removeChild(audio);
            });
            this._audio.clear();
            connection.send({ T: leftVoiceType });
            this._enabled = false;
        }
    }
    addVoice(msg) {
        if (!this.enabled()) {
            return;
        }
        if (connection.id() != msg.Client.Id) {
            this.createPeerConnection(msg.Client.Id, false);
            return;
        }
        for (const [stringId, client] of Object.entries(msg.Clients)) {
            const id = Number(stringId);
            if (connection.id() == id)
                continue;
            this.createPeerConnection(id, true);
        }
    }
    removeVoice(msg) {
        const id = connection.id();
        if (id === msg.Client.Id) {
            return;
        }
        if (this._voice.has(msg.Client.Id)) {
            this._voice.get(msg.Client.Id).close();
            this._voice.delete(msg.Client.Id);
        }
        if (this._audio.has(msg.Client.Id)) {
            const clientElm = HtmlUtil.elm("client-" + msg.Client.Id);
            if (Util.defined(clientElm)) {
                clientElm.removeChild(this._audio.get(msg.Client.Id));
            }
            this._audio.delete(msg.Client.Id);
        }
    }
    createPeerConnection(id, sendOffer) {
        const audioElement = document.createElement("audio");
        audioElement.id = "audio-" + id;
        audioElement.autoplay = true;
        audioElement.controls = true;
        this._audio.set(id, audioElement);
        HtmlUtil.elm("client-" + id).appendChild(audioElement);
        const pc = connection.newPeerConnection();
        this._voice.set(id, pc);
        this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
        pc.onicecandidate = (event) => {
            if (event && event.candidate) {
                connection.send({ T: voiceCandidateType, JSONPeer: { To: id, JSON: event.candidate.toJSON() } });
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState == "disconnected") {
                this.removeVoice({ Client: { Id: id } });
            }
        };
        pc.ontrack = (event) => {
            audioElement.srcObject = event.streams[0];
        };
        pc.createOffer(this._voiceOfferOptions).then((description) => {
            return pc.setLocalDescription(description);
        }).then(() => {
            if (sendOffer) {
                connection.send({ T: voiceOfferType, JSONPeer: { To: id, JSON: pc.localDescription.toJSON() } });
            }
        });
    }
    processVoiceOffer(msg) {
        const pc = this._voice.get(msg.From);
        const offer = msg.JSON;
        pc.setRemoteDescription(offer, () => {
            if (pc.remoteDescription.type == "offer") {
                pc.createAnswer().then((description) => {
                    return pc.setLocalDescription(description);
                }).then(() => {
                    connection.send({ T: voiceAnswerType, JSONPeer: { To: msg.From, JSON: pc.localDescription.toJSON() } });
                });
            }
        }, (e) => LogUtil.d("Failed to set remote description from offer from " + msg.From + ": " + e));
    }
    processVoiceAnswer(msg) {
        const pc = this._voice.get(msg.From);
        const answer = msg.JSON;
        pc.setRemoteDescription(answer, () => { }, (e) => LogUtil.d("Failed to set remote description from answer from " + msg.Client.Id + ": " + e));
        if (pc.remoteDescription && this._voiceCandidates.has(msg.From)) {
            this._voiceCandidates.get(msg.From).forEach((candidate) => {
                pc.addIceCandidate(candidate).then(() => { }, (e) => { LogUtil.d("Failed to add candidate: " + e); });
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
        pc.addIceCandidate(candidate).then(() => { }, (e) => { LogUtil.d("Failed to add candidate: " + e); });
    }
}
