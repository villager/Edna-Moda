import {games, toRoomId, getGame, BaseGame, idUser} from '../games';

import {MessageEmbed} from 'discord.js';

const PASSTHEBOMB_LANGUAGE_DIR = Plugins.resolve(__dirname, 'language.json');

const Lang = Plugins.Language.load(PASSTHEBOMB_LANGUAGE_DIR);

class PassTheBomb extends BaseGame {
	playerList: Map<string, AnyObject>;
	inscriptions: any;
	round: number;
	started: Boolean;
	maxCap: number;
	holder: string | null;
	roundAction: null | any;
	timer: null | any;
	actionMessage: any;
	constructor(options) {
		super(options);
		this.gameType = 'PassTheBomb';
		this.host = options.host;
		this.playerList = new Map();
		this.maxCap = options.maxCap;
		this.inscriptions = null;
		this.actionMessage = null;
		this.started = false;
		this.round = 0;
		this.holder = null;
		this.roundAction = null;
		this.timer = null;
	}
	getLang(id: string | AnyObject, ...params: string[]) {
		return Lang.get(this.lang, id, ...params);
	}
	notifyCreation() {
		if (this.serverType === 'Discord') {
			let Embed = new MessageEmbed({
				title: this.getLang('start', this.host),
				description: `Para unirte escribe ${Config.triggers[0]}ptb join`,
			});
			this.actionMessage = this.send(Embed);
		} else {
		}
	}
	reset() {
		clearTimeout(this.roundAction);
		this.timer = setTimeout(() => {
			let message = this.getLang('explosion', this.holder);
			if (this.serverType === 'Discord') {
				this.send(
					new MessageEmbed({
						title: message,
					}),
				);
			} else {
				this.send(`**${message}**`);
			}
			this.playerList.get(toId(this.holder)).status = 'dead';
			setTimeout(() => {
				this.nextRound();
			}, 1200);
		}, (Math.floor(Math.random() * 26) + 5) * 1000);
	}
	nextRound() {
		this.round++;
		let players = this.getSurvivors();
		clearTimeout(this.timer);
		if (players.length === 1) {
			this.send(`Congrats ${players[0]} you won!`);
			this.destroy();
		} else {
			let rand = (Math.floor(Math.random() * 12) + 3) * 1000;
			let msg;
			if (this.serverType === 'Discord') {
				msg = new MessageEmbed({
					title: this.getLang('wait'),
				});
			} else {
				msg = this.getLang('wat');
			}
			this.actionMessage = this.send(msg);
			this.roundAction = setTimeout(() => {
				this.setBomb();
				let dataMessage = this.getLang('has_bomb', this.holder);
				if (this.serverType === 'Discord') {
					this.actionMessage.then(msg => {
						let embed = new MessageEmbed({
							title: dataMessage,
						});
						msg.edit(embed);
					});
				} else {
					this.send(this.getLang('has_bomb', this.holder));
				}
				this.reset();
			}, rand);
		}
	}
	start() {
		this.round++;
		this.started = true;
		this.nextRound();
	}
	getSurvivors() {
		let survivors = [];
		this.playerList.forEach(player => {
			if (player.status === 'alive') survivors.push(player.name);
		});
		return survivors;
	}
	isPlayer(user: any) {
		if (this.playerList.has(user)) return user;
		let found = false;
		this.playerList.forEach(player => {
			if (parseInt(player.id) === parseInt(user)) found = player.name;
		});
		return found;
	}
	setBomb(user?: string) {
		if (!user) {
			let players = this.getSurvivors();
			this.holder = players[Math.floor(Math.random() * players.length)];
		} else {
			let player = this.isPlayer(user);
			this.holder = player;
		}
	}
	joinUser(user) {
		let uid = toName(user);
		if (this.playerList.has(toId(uid))) return false;
		this.playerList.set(toId(uid), {
			name: uid,
			status: 'alive',
			id: idUser(user),
		});
		this.getUsers();
		if (this.playerList.size === this.maxCap) this.start();
	}
	leaveUser(user) {
		user = toId(user);
		if (this.playerList.has(user)) return false;
		this.playerList.delete(user);
		this.getUsers();
	}
	getUsers() {
		if (this.serverType === 'Discord') {
			let Embed;
			if (!this.started) {
				Embed = new MessageEmbed({
					title: this.getLang('start', this.host),
					description: `Para unirte escribe ${Config.triggers[0]}ptb join\nMaximo de jugadores ${this.maxCap}`,
				});
				if (this.playerList.size > 0) {
					let playerList = [];
					this.playerList.forEach(player => playerList.push(player.name));
					Embed.setFooter(`Jugadores (${this.playerList.size}): ${Plugins.mapList(playerList, this.lang)}`);
				}
				this.actionMessage.then(msg => {
					msg.edit(Embed);
				});
			} else {
			}
		}
	}
}

export const commands = {
	new(target, room, user) {
		if (!games[this.id]) games[this.id] = {};
		if (games[this.id][toRoomId(room)]) return this.sendReply('Ya habia un juego en curso');
		games[this.id][toRoomId(room)] = new PassTheBomb({
			host: toName(user),
			room: room,
			id: this.id,
			serverType: this.serverType,
			language: this.lang,
			maxCap: target ? target : Infinity,
		});
		games[this.id][toRoomId(room)].notifyCreation();
	},
	pass(target, room, user) {
		let game = getGame(this.id, toRoomId(room));
		if (!game || game.gameType !== 'PassTheBomb' || !game.started) return false; // Nothing to report
		if (!target) return false;
		if (toId(game.holder) !== toId(user)) return false;
		if (!game.isPlayer(toId(target))) return false;
		game.setBomb(toId(target));
	},
	start(target, room, user) {
		let game = getGame(this.id, toRoomId(room));
		if (!game || game.gameType !== 'PassTheBomb' || game.started) return false; // Nothing to report
		game.send(`${toName(user)} ha iniciado el juego de pasa la bomba`);
		game.start();
	},
	join(target, room, user) {
		let game = getGame(this.id, toRoomId(room));
		if (!game || game.gameType !== 'PassTheBomb' || game.started) return false; // Nothing to report
		game.joinUser(user);
	},
	leave(target, room, user) {
		let game = getGame(this.id, toRoomId(room));
		if (!game || game.gameType !== 'PassTheBomb' || game.started) return false; // Nothing to report
		game.leaveUser(toName(user));
	},
	getusers(target, room, user) {
		let game = getGame(this.id, toRoomId(room));
		if (!game || game.gameType !== 'PassTheBomb') return false; // Nothing to report
		game.getUsers();
	},
};
