import {BaseParser} from '../parser';

export class Parser extends BaseParser {
	readonly serverType: string;
	bot: AnyObject;
	channel: null | AnyObject;
	messageId: null | number;
	guild: AnyObject | null;
	constructor(bot) {
		super(bot);
		this.serverType = 'Discord';
		this.channel = null;
		this.messageId = null;
		this.guild = null;
	}
	parse(message: any) {
		this.bot.lastMessage = message.content;
		this.bot.lastUser = message.author;
		this.channel = message.channel;
		this.messageId = message.id;
		this.guild = message.guild;
		const commandHandler = this.splitCommand(message.content);
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
