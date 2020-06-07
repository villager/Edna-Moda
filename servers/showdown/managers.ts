const DEFAULT_ACTIVITY = {
	every: 10,
	cmd: '/noonewillusethisthingever',
};
const DEFAULT_DELAY = Config.reconnectingDelay || 1000 * 30;

class Activity extends Plugins.Timers {
	manager: typeof ConnectionManager;
	constructor(manager) {
		super(DEFAULT_ACTIVITY.every * 1000);
		this.manager = manager;
	}
	onBegin() {
		this.start(() => {
			this.check();
		});
	}
	check() {}
}
export class RoomManager extends Plugins.Timers {
	baseRooms: string[];
	server: AnyObject;
	constructor(server) {
		super(1000 * 15);
		this.baseRooms = server.baseRooms;
		this.server = server;
	}
	check() {
		for (const room of this.baseRooms) {
			if (!this.server.rooms[room]) {
				this.server.joinRoom(room);
			}
		}
		this.server.joinedRooms = true;
	}
	onBegin() {
		this.start(() => {
			this.check();
		});
	}
}
export class ConnectionManager extends Plugins.Timers {
	connecting: boolean;
	status: AnyObject;
	closed: boolean;
	maxAttemps: number;
	attemps: number;
	activity: any;
	server: AnyObject;
	conntime: number;
	constructor(server) {
		super(DEFAULT_DELAY);
		this.connecting = false;
		this.status = {connected: false};
		this.closed = false;
		this.maxAttemps = Config.maxAttemps || 3;
		this.attemps = 0;
		this.activity = new Activity(this);
		this.server = server;
		this.conntime = 0;
	}
	onBegin() {
		console.log(`Retrying connection to ${this.server.id} in ${this.time / 1000} seconds`);
		this.start(() => {
			if (this.closed) return;
			this.server.connect();
			this.attemps++;
			if (this.attemps > this.maxAttemps) {
				this.activity.clear();
				this.closed = true;
				console.log(`Connection closed to ${this.server.id}`);
			}
		});
	}
}
export class SendManager {
	/**
	 * @param {String|Array<String>} data
	 * @param {Number} msgMaxLines
	 * @param {function(String)} sendFunc
	 * @param {function} destroyHandler
	 */
	data: string | string[] | any;
	msgMaxLines: number;
	sendFunc: any;
	status: string;
	callback: null | any;
	destroyHandler: any;
	err: any;
	interval: any;
	constructor(data, msgMaxLines, sendFunc, destroyHandler) {
		this.data = data;
		this.msgMaxLines = msgMaxLines;
		this.sendFunc = sendFunc;
		this.status = 'sending';
		this.callback = null;
		this.destroyHandler = destroyHandler;
		this.err = null;
		this.interval = null;
	}

	start() {
		let data = this.data;
		if (!(data instanceof Array)) {
			data = [data.toString()];
		} else {
			data = data.slice();
		}
		const nextToSend = function () {
			if (!data.length) {
				clearInterval(this.interval);
				this.interval = null;
				this.finalize();
				return;
			}
			const toSend = [];
			const firstMsg = data.shift();
			toSend.push(firstMsg);
			let roomToSend = '';
			if (firstMsg.indexOf('|') >= 0) {
				roomToSend = firstMsg.split('|')[0];
			}
			while (data.length > 0 && toSend.length < this.msgMaxLines) {
				const subMsg = data[0];
				if (subMsg.split('|')[0] !== roomToSend) {
					break;
				} else {
					toSend.push(subMsg.split('|').slice(1).join('|'));
					data.shift();
				}
			}
			this.sendFunc(toSend.join('\n'));
		};
		this.interval = setInterval(nextToSend.bind(this), 2000);
		nextToSend.call(this);
	}

	finalize() {
		this.status = 'finalized';
		if (typeof this.callback === 'function') this.callback(this.err);
		if (typeof this.destroyHandler === 'function') this.destroyHandler(this);
	}

	/**
	 * @param {function} callback
	 */
	then(callback) {
		if (this.status !== 'sending') {
			return callback(this.err);
		} else {
			this.callback = callback;
		}
	}

	kill() {
		if (this.interval) clearInterval(this.interval);
		this.interval = null;
		this.err = new Error('Send Manager was killed');
		this.finalize();
	}
}
