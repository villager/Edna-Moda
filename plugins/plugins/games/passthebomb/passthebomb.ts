import {games, toRoomId, getGame, BaseGame} from '../games';

import {MessageEmbed} from 'discord.js';

const PASSTHEBOMB_LANGUAGE_DIR = Plugins.resolve(__dirname, 'language.json');

const Lang = Plugins.Language.load(PASSTHEBOMB_LANGUAGE_DIR);

class PassTheBomb  extends BaseGame {
	playerList: Map<string, AnyObject>;
	inscriptions: any;
	round: number;
	started: Boolean;
	maxCap: number;
    holder: string | null;
	roundAction: null | any;
	timer: null | any;
	constructor(options) {
        super(options);
		this.gameType = 'PassTheBomb';
		this.host = options.host;
		this.playerList = new Map();
		this.maxCap = options.maxCap;
		this.inscriptions = null;
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
			this.inscriptions = this.send(Embed);
		} else {
		}
	}
	reset() {
		clearTimeout(this.roundAction);
		this.timer = setTimeout(() => {
			this.send('**The bomb exploded and killed ' + this.holder + '**');
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
		if(players.length === 1) {
			this.send(`Congrats ${players[0]} you won!`);
			this.destroy();
		} else {
			let rand = (Math.floor(Math.random() * 12) + 3) * 1000;
			this.send('Wait...');
			this.roundAction = setTimeout(() => {
				this.setBomb();
				this.send('La bomba la tiene **' + this.holder + '** utiliza .ptb pass [usuario] ');
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
			if(player.status === 'alive') survivors.push(player.name);
		});
		return survivors;

	}
	setBomb(user?: string) {
		if (!user) {
			let players = this.getSurvivors();
			this.holder = players[Math.floor(Math.random() * players.length)];
		} else {
			this.holder = toId(user);
		}
	}
	joinUser(user) {
		if (this.playerList.has(toId(user))) return false;
		this.playerList.set(toId(user), {
			name: user,
			status: 'alive',
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
					title: `${this.host} ha iniciado un nuevo juego de pasa la bomba!`,
					description: `Para unirte escribe ${Config.triggers[0]}ptb join\nMaximo de jugadores ${this.maxCap}`,
				});
				if (this.playerList.size > 0) {
					let players = '';
					this.playerList.forEach(player => {
						players += player.name + ',';
					});
					Embed.setFooter(`Jugadores (${this.playerList.size}): ${players}`);
				}
				this.inscriptions.then(msg => {
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
            maxCap: target ? target : Infinity
        });
        games[this.id][toRoomId(room)].notifyCreation();
    },
    pass(target, room, user) {
        let game = getGame(this.id, toRoomId(room));
        if (!game || game.gameType !== 'PassTheBomb' || !game.started) return false; // Nothing to report
        if (!target) return false;
        if (toId(game.holder) !== toId(user)) return false;
        if (!game.playerList.has(toId(target))) return false;
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
        game.joinUser(toName(user));
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
}