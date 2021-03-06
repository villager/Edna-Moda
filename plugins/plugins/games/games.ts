export let games = Object.create(null);

export class BaseGame {
	room: any;
	readonly serverType: string;
	gameType: null | string;
	host: string;
	id: string;
	lang: string;
	name: string;
	constructor(options: AnyObject) {
		this.id = options.id;
		this.room = options.room;
		this.name = options.name || Config.name;
		this.serverType = options.serverType;
		this.gameType = null;
		this.lang = options.language || 'spanish';
		this.host = options.host;
	}
	get canHTML() {
		if (Plugins.hasAuth(this.id, this.name, 'html')) return Promise.resolve(true);
		return Promise.reject(false);
	}
	send(data) {
		if (this.serverType === 'Discord') {
			return this.room.send(data);
		} else {
			return Bot.get(this.id).send(data, this.room.id);
		}
	}
	destroy() {
		delete games[this.id][toRoomId(this.room)];
	}
}
const HELP_DIR = Plugins.resolve(__dirname, 'helps.json');
export const init = () => {
	Bot.yallEach(bot => {
		games[bot.id] = {};
	});
	Plugins.Language.Help.add(HELP_DIR);
};
export const key = 'global';

export const getGame = (server: any, room: any) => {
	if (!games[server]) return false;
	if (!games[server][room]) return false;
	return games[server][room];
};

export const idUser = (user: any) => {
	if (user && user.id) {
		user = user.id;
	}
	return user;
};

import * as PassTheBomb from './passthebomb';

export const commands: ChatCommands = {
	ptb: PassTheBomb.commands,
	ptbhelp: true,
	ptbtopic: 'games',
};
