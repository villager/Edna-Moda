'use strict';

const BaseParser = require('../parser');

class Parser extends BaseParser {
	constructor(bot) {
		super(bot);
		this.serverType = 'Showdown';
	}
	sendReply(data) {
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
		let lang = this.room.language ? this.room.language : super.lang;
		return lang;
	}
	parse(room, user, message, pm) {
		this.pmTarget = '';
		this.bot.lastMessage = message;
		if (toId(this.bot.name) === toId(user)) this.bot.group = user.charAt(0);
		this.bot.lastUser = user;
		let commandHandler = this.splitCommand(message);
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
module.exports = Parser;
