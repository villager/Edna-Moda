import {BaseParser} from '../parser';

export class Parser extends BaseParser {
	readonly serverType: string;
	constructor(bot) {
		super(bot);
		this.serverType = 'Showdown';
	}
	sendReply(data: string) {
		if (this.pmTarget) {
			return this.bot.send(`/pm ${toId(this.pmTarget)}, ${data}`, toId(this.room));
		} else {
			if (!this.can('games', false)) {
				// Can"t brodcast
				return this.bot.send(`/pm ${toId(this.user)}, ${data}`, toId(this.room));
			}
			{
				return this.bot.send(data, toId(this.room));
			}
		}
	}
	get lang() {
		const lang = this.room.language ? this.room.language : super.lang;
		return lang;
	}
	parse(room: string, user: string, message: string, pm?: Boolean): void {
		this.pmTarget = '';
		this.bot.lastMessage = message;
		if (toId(this.bot.name) === toId(user)) this.bot.group = user.charAt(0);
		this.bot.lastUser = user;
		const commandHandler = this.splitCommand(message);
		if (typeof commandHandler === 'function') {
			if (toId(this.bot.lastUser) === toId(this.bot.name)) return; // Ignorar los  comandos dichos por el mismo bot
			this.user = user;
			this.message = message;
			this.room = room;
			if (pm) this.pmTarget = user;
			this.run(commandHandler);
		}
	}
}
