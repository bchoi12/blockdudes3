class Pinger {
	private readonly _pingInterval = 500;
	private readonly _maxPings = 4;

	private _connection : Connection;

	private _ping : number;
	private _pings : Array<number>;
	private _pingTimes : Array<number>
	private _lastPingNumber : number;

	constructor(connection : Connection) {
		this._connection = connection;

		this._ping = 0;
		this._pings = [];
		this._pingTimes = [];
		this._lastPingNumber = 0;

		this._connection.addHandler(pingType, (msg : any) => {
			const index = msg.S % this._maxPings;
			this._pings[index] = Date.now() - this._pingTimes[index];

			this._pings.forEach((ping) => {
				this._ping += ping;
			})
			this._ping = Math.ceil(this._ping / this._pings.length);
		});

		const sendPing = () => {
			if (this._connection.ready()) {
				this._connection.sendData({
					T: pingType,
					Ping : {
						S: this._lastPingNumber,
					}
				});
				this._pingTimes[this._lastPingNumber % this._maxPings] = Date.now();
				this._lastPingNumber++;
			} 
			setTimeout(sendPing, this._pingInterval);
		}
		sendPing();
	}

	ping() : number {
		return this._ping;
	}
}