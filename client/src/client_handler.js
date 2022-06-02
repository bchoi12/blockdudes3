import { Client } from './client.js';
import { connection } from './connection.js';
import { ui } from './ui.js';
import { LogUtil } from './util.js';
export class ClientHandler {
    constructor(clientsComponent) {
        this._iceConfig = {
            iceServers: [
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
            ],
        };
        this._voiceOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
        };
        this._clientsComponent = clientsComponent;
        this._clients = new Map();
        this._peerConnections = new Map();
        this._iceCandidates = new Map();
        this._voiceEnabled = false;
    }
    empty() { return this._clients.size === 0; }
    hasClient(id) { return this._clients.has(id); }
    getClient(id) { return this._clients.get(id); }
    setup() {
        connection.addHandler(joinType, (msg) => { this.updateClients(msg); });
        connection.addHandler(leftType, (msg) => { this.updateClients(msg); });
        connection.addHandler(joinVoiceType, (msg) => { this.updateVoice(msg); });
        connection.addHandler(leftVoiceType, (msg) => { this.updateVoice(msg); });
        connection.addHandler(voiceOfferType, (msg) => { this.processVoiceOffer(msg); });
        connection.addHandler(voiceAnswerType, (msg) => { this.processVoiceAnswer(msg); });
        connection.addHandler(voiceCandidateType, (msg) => { this.processVoiceCandidate(msg); });
    }
    toggleVoice() {
        if (!connection.ready()) {
            return;
        }
        if (!this.voiceEnabled()) {
            this._voiceEnabled = true;
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            }).then((stream) => {
                this._stream = stream;
                this._stream.getTracks().forEach(track => track.enabled = true);
                connection.send({ T: joinVoiceType });
            }).catch((e) => {
                this._voiceEnabled = false;
                LogUtil.e("Failed to enable voice chat: " + e);
            });
        }
        else {
            this._stream.getTracks().forEach(track => track.stop());
            this._peerConnections.forEach((pc) => {
                pc.close();
            });
            this._peerConnections.clear();
            this._clients.forEach((client) => {
                client.disableVoiceControls();
            });
            connection.send({ T: leftVoiceType });
            this._voiceEnabled = false;
        }
    }
    updateClients(msg) {
        if (this.empty()) {
            for (let [stringId, client] of Object.entries(msg.Clients)) {
                this.addClient(new Client(client.Id, client.Name));
            }
        }
        else if (msg.T === joinType) {
            this.addClient(new Client(msg.Client.Id, msg.Client.Name));
        }
        else if (msg.T === leftType) {
            this.removeClient(msg.Client.Id);
            this.removeVoice(msg.Client.Id);
        }
    }
    addClient(client) {
        client.appendTo(this._clientsComponent);
        this._clients.set(client.id(), client);
        ui.print(client.displayName() + " just joined!");
    }
    removeClient(id) {
        let client = this._clients.get(id);
        ui.print(client.displayName() + " left");
        client.delete();
        this._clients.delete(id);
    }
    voiceEnabled() {
        return this._voiceEnabled;
    }
    updateVoice(msg) {
        if (msg.T === joinVoiceType) {
            this.addVoice(msg.Client.Id, msg.Clients);
        }
        else if (msg.T === leftVoiceType) {
            this.removeVoice(msg.Client.Id);
        }
    }
    addVoice(id, clients) {
        ui.print(ui.getClientName(id) + " joined voice chat!");
        if (!this.voiceEnabled()) {
            ui.print("Enable voice chat in the pause menu to chat with " + ui.getClientName(id));
            return;
        }
        if (id != connection.id()) {
            this.createPeerConnection(id, false);
            return;
        }
        for (const [stringId, client] of Object.entries(clients)) {
            const clientId = Number(stringId);
            if (clientId == connection.id())
                continue;
            this.createPeerConnection(clientId, true);
        }
    }
    removeVoice(id) {
        if (this.hasClient(id)) {
            ui.print(ui.getClientName(id) + " left voice chat");
        }
        if (id === connection.id()) {
            return;
        }
        if (this._peerConnections.has(id)) {
            this._peerConnections.get(id).close();
            this._peerConnections.delete(id);
            if (this._clients.has(id)) {
                this._clients.get(id).disableVoiceControls();
            }
        }
    }
    createPeerConnection(id, sendOffer) {
        const pc = new RTCPeerConnection(this._iceConfig);
        this._peerConnections.set(id, pc);
        this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
        pc.onicecandidate = (event) => {
            if (event && event.candidate) {
                connection.send({ T: voiceCandidateType, JSONPeer: { To: id, JSON: event.candidate.toJSON() } });
            }
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected") {
                this.removeVoice(id);
            }
        };
        pc.ontrack = (event) => {
            this.getClient(id).enableVoiceControls(event.streams[0]);
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
        const pc = this._peerConnections.get(msg.From);
        const offer = msg.JSON;
        pc.setRemoteDescription(offer, () => {
            if (pc.remoteDescription.type === "offer") {
                pc.createAnswer().then((description) => {
                    return pc.setLocalDescription(description);
                }).then(() => {
                    connection.send({ T: voiceAnswerType, JSONPeer: { To: msg.From, JSON: pc.localDescription.toJSON() } });
                });
            }
        }, (e) => LogUtil.e("Failed to set remote description from offer from " + msg.From + ": " + e));
    }
    processVoiceAnswer(msg) {
        const pc = this._peerConnections.get(msg.From);
        const answer = msg.JSON;
        pc.setRemoteDescription(answer, () => { }, (e) => LogUtil.e("Failed to set remote description from answer from " + msg.Client.Id + ": " + e));
        if (pc.remoteDescription && this._iceCandidates.has(msg.From)) {
            this._iceCandidates.get(msg.From).forEach((candidate) => {
                pc.addIceCandidate(candidate).then(() => { }, (e) => { LogUtil.e("Failed to add candidate: " + e); });
            });
            this._iceCandidates.delete(msg.From);
        }
    }
    processVoiceCandidate(msg) {
        const pc = this._peerConnections.get(msg.From);
        const candidate = msg.JSON;
        if (!pc.remoteDescription) {
            if (!this._iceCandidates.has(msg.From)) {
                this._iceCandidates.set(msg.From, new Array());
            }
            this._iceCandidates.get(msg.From).push(candidate);
            return;
        }
        pc.addIceCandidate(candidate).then(() => { }, (e) => { LogUtil.e("Failed to add candidate: " + e); });
    }
}
