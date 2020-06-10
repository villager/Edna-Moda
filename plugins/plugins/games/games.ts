import {MessageEmbed} from 'discord.js';

export let games = Object.create(null);

export const init = () => {
	Bot.yallEach(bot => {
		games[bot.id] = {};
	});
};
export const key = 'global';

class PassTheBomb {
	room: any;
	readonly serverType: string;
	host: string;
	id: string;
	playerList: AnyObject[];
	inscriptions: any;
	started: Boolean;
	constructor(options) {
		this.id = options.id;
		this.room = options.room;
		this.serverType = options.serverType;
		this.host = options.host;
		this.playerList = [];
		this.inscriptions = null;
		this.started = false;
	}
	send(data) {
		if (this.serverType === 'Discord') {
			return this.room.send(data);
		} else {
			return Bot.get(this.id).send(data, this.room);
		}
	}
	notifyCreation() {
		if (this.serverType === 'Discord') {
			let Embed = new MessageEmbed({
				title: `${this.host} ha iniciado un nuevo juego de pasa la bomba!`,
				description: `Para unirte escribe ${Config.triggers[0]}ptb join`,
			});
			this.inscriptions = this.send(Embed);
		} else {
		}
	}
	joinUser(user) {
		if (this.playerList.map(user => user.id).indexOf(user) > -1) return false;
		this.playerList.push({
			name: user,
			id: toId(user),
		});
		this.getUsers();
	}
	leaveUser(user) {
		let userIndex = this.playerList.map(user => user.id).indexOf(toId(user));
		if (userIndex === -1) return false;
		this.playerList.splice(userIndex, 1);
		this.getUsers();
	}
	getUsers() {
		if (this.serverType === 'Discord') {
			let Embed;
			if (!this.started) {
				Embed = new MessageEmbed({
					title: `${this.host} ha iniciado un nuevo juego de pasa la bomba!`,
					description: `Para unirte escribe ${Config.triggers[0]}ptb join`,
				});
				if (this.playerList.length > 0)
					Embed.setFooter(
						`Jugadores (${this.playerList.length}): ${this.playerList
							.map((user: AnyObject) => user.name as string)
							.join(', ')}`,
					);
				this.inscriptions.then(msg => {
					msg.edit(Embed);
				});
			} else {
			}
		}
	}
}
const toRoomId = (text: any) => {
	return toId(toName(text));
};
const getGame = (server: any, room: any) => {
	if (!games[server]) return false;
	if (!games[server][room]) return false;
	return games[server][room];
};
export const commands: ChatCommands = {
	ptb: {
		new(target, room, user) {
			if (!games[this.id]) games[this.id] = {};
			if (games[this.id][toRoomId(room)]) return this.sendReply('Ya habia un juego en curso');
			games[this.id][toRoomId(room)] = new PassTheBomb({
				host: toName(user),
				room: room,
				id: this.id,
				serverType: this.serverType,
			});
			games[this.id][toRoomId(room)].notifyCreation();
		},
		join(target, room, user) {
			let game = getGame(this.id, toRoomId(room));
			if (!game || game.started) return false; // Nothing to report
			game.joinUser(toName(user));
		},
		leave(target, room, user) {
			let game = getGame(this.id, toRoomId(room));
			if (!game || game.started) return false; // Nothing to report
			game.leaveUser(toName(user));
		},
		getusers(target, room, user) {
			let game = getGame(this.id, toRoomId(room));
			if (!game) return false; // Nothing to report
			game.getUsers();
		},
	},
};
