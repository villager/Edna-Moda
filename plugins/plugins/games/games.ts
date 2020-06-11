
export let games = Object.create(null);

export class BaseGame {
	room: any;
	readonly serverType: string;
	gameType: null | string;
	host: string;
	id: string;
	lang: string;
	constructor(options: AnyObject) {
		this.id = options.id;
		this.room = options.room;
		this.serverType = options.serverType;
		this.gameType = null;
		this.lang = options.language || "spanish";
		this.host = options.host;
	}
	send(data) {
		if (this.serverType === 'Discord') {
			return this.room.send(data);
		} else {
			return Bot.get(this.id).send(data, this.room);
		}
	}
	destroy() {
		delete games[this.id][toRoomId(this.room)];
	}
}
export const init = () => {
	Bot.yallEach(bot => {
		games[bot.id] = {};
	});
};
export const key = 'global';

export const toRoomId = (text: any) => {
	return toId(toName(text));
};
export const getGame = (server: any, room: any) => {
	if (!games[server]) return false;
	if (!games[server][room]) return false;
	return games[server][room];
};
import * as PassTheBomb from './passthebomb';

export const commands: ChatCommands = {
	ptb: PassTheBomb.commands,
};
