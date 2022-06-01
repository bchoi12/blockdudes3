import { Client } from './client.js'
import { connection } from './connection.js'
import { HtmlComponent } from './html_component.js'
import { ui } from './ui.js'
import { LogUtil, HtmlUtil, Util } from './util.js'

export class ClientHandler {
	private readonly _voiceOfferOptions = {
		offerToReceiveAudio: true,
		offerToReceiveVideo: false,
	};

	private _clientsComponent : HtmlComponent;
	private _clients : Map<number, Client>
	private _peerConnections : Map<number, RTCPeerConnection>;
	private _iceCandidates : Map<number, Array<RTCIceCandidate>>;
	private _voiceEnabled : boolean;

	private _stream : MediaStream;

	constructor(clientsComponent : HtmlComponent) {
		this._clientsComponent = clientsComponent;
		this._clients = new Map();
		this._peerConnections = new Map();
		this._iceCandidates = new Map();
		this._voiceEnabled = false;
	}

	empty() : boolean { return this._clients.size === 0; }
	hasClient(id : number) : boolean { return this._clients.has(id); }
	getClient(id : number) : Client { return this._clients.get(id); }

	setup() : void {
 		connection.addHandler(joinType, (msg : { [k: string]: any }) => { this.updateClients(msg); });
		connection.addHandler(leftType, (msg : { [k: string]: any }) => { this.updateClients(msg); });
		connection.addHandler(joinVoiceType, (msg : { [k: string]: any }) => { this.updateVoice(msg); });
		connection.addHandler(leftVoiceType, (msg : { [k: string]: any }) => { this.updateVoice(msg); });
		connection.addHandler(voiceOfferType, (msg : { [k: string]: any }) => { this.processVoiceOffer(msg); });
		connection.addHandler(voiceAnswerType, (msg : { [k: string]: any }) => { this.processVoiceAnswer(msg); });
		connection.addHandler(voiceCandidateType, (msg : { [k: string]: any }) => { this.processVoiceCandidate(msg); });
	}

	toggleVoice() : void {
		if (!connection.ready()) {
			return;
		}

		if (!this.voiceEnabled()) {
			this._voiceEnabled = true;
			navigator.mediaDevices.getUserMedia({
				audio: {
					// @ts-ignore
					autoGainControl: true,
				    channelCount: 2,
				    echoCancellation: true,
				    // @ts-ignore
				    noiseSuppression: true,
				},
			    video: false,
		    }).then((stream) => {
		    	this._stream = stream;
		      	this._stream.getTracks().forEach(track => track.enabled = true);
				connection.send({ T: joinVoiceType });
		    }).catch((e) => {
		    	this._voiceEnabled = false;
		    	LogUtil.e("Failed to enable voice chat: " + e);
		    });
		} else {
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

	private updateClients(msg : { [k: string]: any }) : void {
		if (this.empty()) {
			for (let [stringId, client] of Object.entries(msg.Clients) as [string, any]) {
				this.addClient(new Client(client.Id, client.Name));
			}
		} else if (msg.T === joinType) {
			this.addClient(new Client(msg.Client.Id, msg.Client.Name));
		} else if (msg.T === leftType) {
			this.removeClient(msg.Client.Id);
			this.removeVoice(msg.Client.Id);
		}
	}

	private addClient(client : Client) : void {
		client.appendTo(this._clientsComponent);
		this._clients.set(client.id(), client);
		ui.print(client.displayName() + " just joined!");
	}

	private removeClient(id : number) : void {
		let client = this._clients.get(id);
		ui.print(client.displayName() + " left");

		client.delete();
		this._clients.delete(id);
	}

	private voiceEnabled() : boolean {
		return this._voiceEnabled;
	}

	private updateVoice(msg : { [k: string]: any }) : void {
		if (msg.T === joinVoiceType) {
			this.addVoice(msg.Client.Id);
		} else if (msg.T === leftVoiceType) {
			this.removeVoice(msg.Client.Id);
		}
	}

	private addVoice(id : number) : void {
		ui.print(ui.getClientName(id) + " joined voice chat!");

		if (!this.voiceEnabled()) {
			ui.print("Enable voice chat in the pause menu to chat with " + ui.getClientName(id));
			return;
		}

		// Create connection for the new client.
		if (id != connection.id()) {
			this.createPeerConnection(id, /*sendOffer=*/false);
			return;
		}

		// Send an offer to all existing clients.
		this._clients.forEach((client, clientId) => {
			if (clientId !== connection.id()) {
				this.createPeerConnection(clientId, /*sendOffer=*/true);
			}
		});
	}

	private removeVoice(id : number) : void {
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

	private createPeerConnection(id : number, sendOffer : boolean) {
		const pc = connection.newPeerConnection();
		this._peerConnections.set(id, pc);
      	this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
		pc.onicecandidate = (event) => {
			if (event && event.candidate) {
				connection.send({T: voiceCandidateType, JSONPeer: {To: id, JSON: event.candidate.toJSON() }});
			}
		}
		pc.onconnectionstatechange = () => {
			if(pc.connectionState === "disconnected") {
			    this.removeVoice(id);
			}
		}
		pc.ontrack = (event) => {
			this.getClient(id).enableVoiceControls(event.streams[0]);
		}	

		pc.createOffer(this._voiceOfferOptions).then((description) => {
			return pc.setLocalDescription(description);
		}).then(() => {
			if (sendOffer) {
				connection.send({T: voiceOfferType, JSONPeer: {To: id, JSON: pc.localDescription.toJSON()}});
			}
		});	
	}

	private processVoiceOffer(msg : any) : void {
		const pc = this._peerConnections.get(msg.From);
		const offer = msg.JSON;
		pc.setRemoteDescription(offer, () => {
			if (pc.remoteDescription.type === "offer") {
				pc.createAnswer().then((description) => {
					return pc.setLocalDescription(description);
				}).then(() => {
					connection.send({T: voiceAnswerType, JSONPeer: {To: msg.From, JSON: pc.localDescription.toJSON() }});
				})
			}
		}, (e) => LogUtil.e("Failed to set remote description from offer from " + msg.From + ": " + e));
	}

	private processVoiceAnswer(msg : any) : void {
		const pc = this._peerConnections.get(msg.From);
		const answer = msg.JSON;
		pc.setRemoteDescription(answer, () => {}, (e) => LogUtil.e("Failed to set remote description from answer from " + msg.Client.Id + ": " + e));

		if (pc.remoteDescription && this._iceCandidates.has(msg.From)) {
			this._iceCandidates.get(msg.From).forEach((candidate) => {
				pc.addIceCandidate(candidate).then(() => {}, (e) => { LogUtil.e("Failed to add candidate: " + e); });
			});

			this._iceCandidates.delete(msg.From);
		}
	}

	private processVoiceCandidate(msg : any) : void {
		const pc = this._peerConnections.get(msg.From);
		const candidate = msg.JSON;
		if (!pc.remoteDescription) {
			if (!this._iceCandidates.has(msg.From)) {
				this._iceCandidates.set(msg.From, new Array<RTCIceCandidate>());
			}
			this._iceCandidates.get(msg.From).push(candidate);
			return;
		}
		pc.addIceCandidate(candidate).then(() => {}, (e) => { LogUtil.e("Failed to add candidate: " + e); });
	}
}