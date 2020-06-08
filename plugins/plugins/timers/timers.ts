
export const key = ['showdown', 'discord'];
let timers = Object.create(null);

class Timer extends Plugins.Timers {
	id: any;
	time: number;
	room: string | any;
	server: any;
	midAnnunce: any;
	constructor(server, room, time) {
		super(time * 1000 * 60);
		this.id = server;
		this.time = time * 1000 * 60;
		this.room = room;
		this.server = server;
		this.midAnnunce = new Plugins.Timers(this.time / 2);
		this.onBeing();
	}
	onBeing() {
		this.run();
	}
	send(data) {
		if (this.id === 'discord') {
			this.room.send(data);
		} else {
			Bot(this.id).send(data, this.room);
		}
	}
	run() {
		this.midAnnunce.start(() => {
			this.mid();
		});
		this.start(() => {
			this.send(`El tiempo se ha acabado!`);
		});
	}
	mid() {
		this.send(`Quedan ${this.time / 2 / 1000} segundos`);
	}
	clearTimers() {
		this.clear();
		this.midAnnunce.clear();
	}
}

export function init() {};
export const psCommands = {
	timer: {},
};

export const discordCommands = {
	timertopic: 'dynamic',
	timer: {
		new(target, room, user) {
			if (!target) return this.sendReply('Especifica un tiempo en minutos');
			if (!timers[toId(room.guild.name)]) timers[toId(room.guild.name)] = {};
			if (timers[toId(room.guild.name)][toId(room.name)]) return this.sendReply('Ya habia un timer en la sala');
			timers[toId(room.guild.name)][toId(room.name)] = new Timer(this.id, room, target);
		},
	},
};
