import {Client} from 'discord.js';
import {Server} from './server';

export class DiscordClient extends Client {
	activity: string;
	servers: any;
	name: string;
	constructor() {
		super();
		this.activity = `Usame con: ${Config.triggers.join(' o ')}`;
		this.servers = new Map();
		this.name = Config.name;
	}
	get(name: any) {
		name = name.name ? toId(name.name) : toId(name);
		if (!this.servers.has(name)) return false;
		return this.servers.get(name);
	}
	status() {
		this.on('ready', () => {
			this.user.setUsername(Config.name);
			this.user.setActivity(this.activity);
		});
	}
	sendMsg(id, message) {
		let sendRoom = null;
		this.guilds.cache.forEach(guild => {
			guild.channels.cache.forEach(channel => {
				if (channel.id === id) sendRoom = channel;
			});
		});
		if (sendRoom) {
			sendRoom.send(message);
			return true;
		} else {
			return false;
		}
	}
	sendDM(id, message) {
		let sendTo = null;
		this.guilds.cache.forEach(guild => {
			guild.members.cache.forEach(user => {
				if (user.id === id) {
					sendTo = user;
				}
			});
		});
		if (sendTo) {
			sendTo.send(message);
			return true;
		} else {
			return false;
		}
	}
	logs() {
		this.on('error', e => new Error(`${e} \n`));
		this.on('warn', e => new Error(`WARN STATUS: ${e}\n`));
		//this.on("debug", e => console.log(`DEBUG STATUS: ${e}\n`)); -- No spam
	}
	connect() {
		this.status();
		this.logs();
		console.log(this.servers);
		this.on('message', async message => {
			if (!this.get(message.guild)) {
				this.servers.set(toId(message.guild.name), new Server(message.guild));
			}
			this.get(message.guild).parser.parse(message);
		});
		// Connection to discord
		this.login(Config.token)
			.then(() => {
				console.log(`${Config.name} conectado correctamente a Discord`);
			})
			.catch(() => {
				console.log('No se pudo conectar a Discord');
			});
	}
}
