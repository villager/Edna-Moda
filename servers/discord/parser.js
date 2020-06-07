'use strict';

const BaseParser = require('../parser');

class Parser extends BaseParser {
	constructor(bot) {
		super(bot);
		this.serverType = 'Discord';
	}
	parse(message) {
		this.bot.lastMessage = message.content;
		this.bot.lastUser = message.author;
		this.channel = message.channel;
		this.messageId = message.id;
		this.guild = message.guild;
		let commandHandler = this.splitCommand(message.content);
		if (typeof commandHandler === 'function') {
			if (toId(this.bot.lastUser.username) === toId(Config.name)) return; // Ignorar los  comandos dichos por el mismo bot
			const channel = message.channel;
			this.room = channel;
			this.user = message.author;
			this.message = message.content;
			message = this.run(commandHandler);
		}
	}
	sendReply(data) {
		this.channel.send(data).catch(() => {});
	}
}
module.exports = Parser;
