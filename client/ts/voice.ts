import { Connection } from './connection.js'
import { LogUtil, HtmlUtil, Util } from './util.js'

export class Voice {
	private readonly _voiceOfferOptions = {
		offerToReceiveAudio: true,
		offerToReceiveVideo: false,
	};

	private _connection : Connection;
	private _stream : MediaStream;

	private _enabled : boolean;

	private _voice : Map<number, RTCPeerConnection>;
	private _voiceCandidates : Map<number, Array<RTCIceCandidate>>;
	private _audio : Map<number, HTMLAudioElement>;

	constructor(connection : Connection) {
		this._connection = connection;

		this._enabled = false;

		this._connection.addHandler(joinVoiceType, (msg : any) => { this.addVoice(msg); });
		this._connection.addHandler(leftType, (msg : any) => { this.removeVoice(msg); });
		this._connection.addHandler(leftVoiceType, (msg : any) => { this.removeVoice(msg); });
		this._connection.addHandler(voiceOfferType, (msg : any) => { this.processVoiceOffer(msg) });
		this._connection.addHandler(voiceAnswerType, (msg : any) => { this.processVoiceAnswer(msg) });
		this._connection.addHandler(voiceCandidateType, (msg : any) => { this.processVoiceCandidate(msg) });

		this._voice = new Map();
		this._voiceCandidates = new Map();
		this._audio = new Map();
	}

	enabled() : boolean {
		return this._enabled;
	}

	toggleVoice() : void {
		if (!this._connection.ready()) {
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
				this._connection.send({ T: joinVoiceType });
		    }).catch((e) => {
		    	this._enabled = false;
		    	LogUtil.d("Failed to enable voice chat: " + e);
		    });
		} else {
	      	this._stream.getTracks().forEach(track => track.stop());
			this._voice.forEach((pc) => {
				pc.close();
			});
			this._voice.clear();

			this._audio.forEach((audio, id) => {
				HtmlUtil.elm("client-" + id).removeChild(audio);
			});
			this._audio.clear();

			this._connection.send({ T: leftVoiceType });
			this._enabled = false;
		}
	}

	private addVoice(msg : any) : void {
		if (!this.enabled()) {
			return;
		}

		// Create connection for the new client.
		if (this._connection.id() != msg.Client.Id) {
			this.createPeerConnection(msg.Client.Id, false);
			return;
		}

		// Send an offer to all existing clients.
		for (const [stringId, client] of Object.entries(msg.Clients) as [string, any]) {
			const id = Number(stringId);
			if (this._connection.id() == id) continue;

			this.createPeerConnection(id, true);
		}
	}

	private removeVoice(msg : any) : void {
		const id = this._connection.id();
		if (id == msg.Client.Id) {
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

	private createPeerConnection(id : number, sendOffer : boolean) {
		const audioElement = <HTMLAudioElement>document.createElement("audio");
		audioElement.id = "audio-" + id;
		audioElement.autoplay = true;
		audioElement.controls = true;
		this._audio.set(id, audioElement);
		HtmlUtil.elm("client-" + id).appendChild(audioElement);

		const pc = this._connection.newPeerConnection();
		this._voice.set(id, pc);
      	this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));

		pc.onicecandidate = (event) => {
			if (event && event.candidate) {
				this._connection.send({T: voiceCandidateType, JSONPeer: {To: id, JSON: event.candidate.toJSON() }});
			}
		}
		pc.onconnectionstatechange = () => {
			if(pc.connectionState == "disconnected") {
			    this.removeVoice({Client: { Id: id }});
			}
		}
		pc.ontrack = (event) => {
			audioElement.srcObject = event.streams[0];
		}	

		pc.createOffer(this._voiceOfferOptions).then((description) => {
			return pc.setLocalDescription(description);
		}).then(() => {
			if (sendOffer) {
				this._connection.send({T: voiceOfferType, JSONPeer: {To: id, JSON: pc.localDescription.toJSON()}});
			}
		});	
	}

	private processVoiceOffer(msg : any) : void {
		const pc = this._voice.get(msg.From);

		const offer = msg.JSON;
		pc.setRemoteDescription(offer, () => {
			if (pc.remoteDescription.type == "offer") {
				pc.createAnswer().then((description) => {
					return pc.setLocalDescription(description);
				}).then(() => {
					this._connection.send({T: voiceAnswerType, JSONPeer: {To: msg.From, JSON: pc.localDescription.toJSON() }});
				})
			}
		}, (e) => LogUtil.d("Failed to set remote description from offer from " + msg.From + ": " + e));
	}

	private processVoiceAnswer(msg : any) : void {
		const pc = this._voice.get(msg.From);
		const answer = msg.JSON;
		pc.setRemoteDescription(answer, () => {}, (e) => LogUtil.d("Failed to set remote description from answer from " + msg.Client.Id + ": " + e));

		if (pc.remoteDescription && this._voiceCandidates.has(msg.From)) {
			this._voiceCandidates.get(msg.From).forEach((candidate) => {
				pc.addIceCandidate(candidate).then(() => {}, (e) => { LogUtil.d("Failed to add candidate: " + e); });
			});

			this._voiceCandidates.delete(msg.From);
		}
	}

	private processVoiceCandidate(msg : any) : void {
		const pc = this._voice.get(msg.From);
		const candidate = msg.JSON;
		if (!pc.remoteDescription) {
			if (!this._voiceCandidates.has(msg.From)) {
				this._voiceCandidates.set(msg.From, new Array<RTCIceCandidate>());
			}
			this._voiceCandidates.get(msg.From).push(candidate);
			return;
		}

		pc.addIceCandidate(candidate).then(() => {}, (e) => { LogUtil.d("Failed to add candidate: " + e); });
	}
}