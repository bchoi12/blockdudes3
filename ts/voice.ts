class Voice {
	private readonly _voiceOfferOptions = {
		offerToReceiveAudio: true,
		offerToReceiveVideo: false,
	};

	private _connection : Connection;

	private _id : number;
	private _voice : Map<number, RTCPeerConnection>;
	private _voiceCandidates : Map<number, Array<RTCIceCandidate>>;

	constructor(connection : Connection) {
		this._id = connection.id();
		this._connection = connection;

		this._connection.addHandler(joinVoiceType, (msg : any) => { this.updateVoice(msg); });
		this._connection.addHandler(clientOfferType, (msg : any) => { this.processVoiceOffer(msg) });
		this._connection.addHandler(clientAnswerType, (msg : any) => { this.processVoiceAnswer(msg) });
		this._connection.addHandler(clientCandidateType, (msg : any) => { this.processVoiceCandidate(msg) });

		this._voice = new Map();
		this._voiceCandidates = new Map();
	}

	join() : void {
		this._connection.send({ T: joinVoiceType });
	}

	leave() : void {
		this._connection.send({ T: leftVoiceType });
	}

	private updateVoice(msg : any) : void {
		const createPeerConnection = (id : number) => {
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
						this._connection.send({T: clientOfferType, JSONId: { Id: this._id, JSON: pc.localDescription.toJSON() }});
					});
				}
		    }).catch((e) => {
		    	debug(e);
		    });

			pc.onicecandidate = (event) => {
				if (event && event.candidate) {
					this._connection.send({T: clientCandidateType, JSONId: { Id: this._id, JSON: event.candidate.toJSON() }});
				}
			}

			pc.onconnectionstatechange = () => {
				if (pc.connectionState == "connected") {
					debug("voice connected!");
				}
			}

			pc.ontrack = (event) => {
				elm("audio").srcObject = event.streams[0];
			}		
		};

		// Connect to newly joined client
		if (this._id != msg.Id) {
			debug("voice: connect to new " + msg.Id);
			createPeerConnection(msg.Id);
			return;
		}

		// Initialize all other clients
		for (const [stringId, client] of Object.entries(msg.Cs) as [string, any]) {
			const id = Number(stringId);
			if (this._id == id) continue;

			debug("voice: initialize " + id);
			createPeerConnection(id);
		}
	}

	private processVoiceOffer(msg : any) : void {
		debug("Process offer for " + msg.Id + ", my ID=" + this._id);

		const pc = this._voice.get(msg.Id);
		const offer = msg.JSON;
		pc.setRemoteDescription(offer, () => {
			if (pc.remoteDescription.type == "offer") {
				pc.createAnswer().then((description) => {
					return pc.setLocalDescription(description);
				}).then(() => {
					this._connection.send({T: clientAnswerType, JSONId: { Id: this._id, JSON: pc.localDescription.toJSON() }});
				})
			}
		}, () => debug("Failed to set offer"));
	}

	private processVoiceAnswer(msg : any) : void {
		debug("Process answer for " + msg.Id + ", my ID=" + this._id);

		const pc = this._voice.get(msg.Id);
		const answer = msg.JSON;
		pc.setRemoteDescription(answer);

		if (pc.remoteDescription && this._voiceCandidates.has(msg.Id)) {
			this._voiceCandidates.get(msg.Id).forEach((candidate) => {
				pc.addIceCandidate(candidate).then(() => {}, (e) => { debug("Failed to add candidate: " + e); });
			});

			this._voiceCandidates.delete(msg.Id);
		}
	}

	private processVoiceCandidate(msg : any) : void {
		const pc = this._voice.get(msg.Id);
		const candidate = msg.JSON;
		if (!pc.remoteDescription) {
			if (!this._voiceCandidates.has(msg.Id)) {
				this._voiceCandidates.set(msg.Id, new Array<RTCIceCandidate>());
			}
			this._voiceCandidates.get(msg.Id).push(candidate);
			return;
		}

		pc.addIceCandidate(candidate).then(() => {}, (e) => { debug("Failed to add candidate: " + e); });
	}
}