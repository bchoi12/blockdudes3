import { ClientWrapper } from './client_wrapper.js'
import { connection } from './connection.js'
import { Html } from './html.js'
import { InterfaceHandler } from './interface_handler.js'
import { ui, InputMode } from './ui.js'
import { LogUtil, Util } from './util.js'

export class ClientHandler implements InterfaceHandler {
	private readonly _iceConfig = {
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

	private readonly _voiceOfferOptions = {
		offerToReceiveAudio: true,
		offerToReceiveVideo: false,
	};

	private _clientsElm : HTMLElement;
	private _clients : Map<number, ClientWrapper>
	private _peerConnections : Map<number, RTCPeerConnection>;
	private _iceCandidates : Map<number, Array<RTCIceCandidate>>;
	private _voiceEnabled : boolean;

	private _stream : MediaStream;


	constructor() {
		this._clientsElm = Html.elm(Html.fieldsetClients);
		this._clients = new Map();
		this._peerConnections = new Map();
		this._iceCandidates = new Map();
		this._voiceEnabled = false;
	}

	setup() : void {
 		connection.addHandler(joinType, (msg : { [k: string]: any }) => { this.updateClients(msg); });
		connection.addHandler(leftType, (msg : { [k: string]: any }) => { this.updateClients(msg); });
		connection.addHandler(joinVoiceType, (msg : { [k: string]: any }) => { this.updateVoice(msg); });
		connection.addHandler(leftVoiceType, (msg : { [k: string]: any }) => { this.updateVoice(msg); });
		connection.addHandler(voiceOfferType, (msg : { [k: string]: any }) => { this.processVoiceOffer(msg); });
		connection.addHandler(voiceAnswerType, (msg : { [k: string]: any }) => { this.processVoiceAnswer(msg); });
		connection.addHandler(voiceCandidateType, (msg : { [k: string]: any }) => { this.processVoiceCandidate(msg); });

		Html.elm(Html.buttonVoice).onclick = (e) => {
			this.toggleVoice();
			e.stopPropagation();
		};
	}

	changeInputMode(mode : InputMode) : void {}

	displayName(id : number) : string {
		return this._clients.has(id) ? this._clients.get(id).displayName() : "Unknown";
	}

	private toggleVoice() : void {
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
		if (this._clients.size === 0) {
			for (let [stringId, client] of Object.entries(msg.Clients) as [string, any]) {
				this.addClient(new ClientWrapper(client.Id, client.Name));
			}
		} else if (msg.T === joinType) {
			this.addClient(new ClientWrapper(msg.Client.Id, msg.Client.Name));
		} else if (msg.T === leftType) {
			this.removeClient(msg.Client.Id);
			this.removeVoice(msg.Client.Id);
		}
	}

	private addClient(client : ClientWrapper) : void {
		this._clientsElm.append(client.elm());
		this._clients.set(client.id(), client);
		ui.print(client.displayName() + " just joined!");
	}

	private removeClient(id : number) : void {
		let client = this._clients.get(id);
		ui.print(client.displayName() + " left");

		this._clientsElm.removeChild(client.elm());
		this._clients.delete(id);
	}

	private voiceEnabled() : boolean {
		return this._voiceEnabled;
	}

	private updateVoice(msg : { [k: string]: any }) : void {
		if (msg.T === joinVoiceType) {
			this.addVoice(msg.Client.Id, msg.Clients);
		} else if (msg.T === leftVoiceType) {
			this.removeVoice(msg.Client.Id);
		}
	}

	private addVoice(id : number, clients : { [k: string]: any }) : void {
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

		// Send an offer to all clients as directed by the server.
		for (const [stringId, client] of Object.entries(clients) as [string, any]) {
			const clientId = Number(stringId);
			if (clientId == connection.id()) continue;

			this.createPeerConnection(clientId, true);
		}
	}

	private removeVoice(id : number) : void {
		if (this._clients.has(id)) {
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
		const pc = new RTCPeerConnection(this._iceConfig);
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
			this._clients.get(id).enableVoiceControls(event.streams[0]);
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