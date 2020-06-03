"use strict";

class Parser {
    constructor(bot) {
		this.bot = bot;
		this.messageId = 0;
		this.target = '';
	}
	get id() {
		return this.bot.id;
	}
	splitToken(message) {
		message = splint(message, ' ');
		return message;
	}
	splitOne(target) {
		const commaIndex = target.indexOf(',');
		if (commaIndex < 0) {
			return [target.trim(), ''];
		}
		return [target.slice(0, commaIndex).trim(), target.slice(commaIndex + 1).trim()];
	}
	splitCommand(message) {
		this.cmd = '';
		this.cmdToken = '';
		this.target = '';
		let isWord = false;
		if (!message || !message.trim().length) return;
		let cmdToken = message.charAt(0);
        if (Config.triggers.indexOf(cmdToken) === -1) {
			let maybeToken = this.splitToken(message);
			if (Config.triggers.indexOf(maybeToken[0]) > -1) {
				cmdToken = maybeToken[0];
				isWord = true;
			} else {
				return;
			}
		}
		let cmd = '', target = '';
		if (isWord) {
			let splitWords = this.splitToken(message);
			if (cmdToken === splitWords[1]) return;
			if (splitWords.length > 2) {
				cmd = splitWords[1];
				splitWords.splice(splitWords.indexOf(cmdToken), 1);
				splitWords.splice(splitWords.indexOf(cmd), 1);
				target = splitWords.join(' ');
			} else {
				message = message.split(' ');
				cmd = message[1];
				target = '';
			}
		} else {
			if (cmdToken === message.charAt(1)) return;
			let spaceIndex = message.indexOf(' ');
			if (spaceIndex > 0) {
				cmd = message.slice(1, spaceIndex).toLowerCase();
				target = message.slice(spaceIndex + 1);
			} else {
				cmd = message.slice(1).toLowerCase();
				target = '';
			}
		}
		let curCommands = this.bot.commands;
		let commandHandler;
		let fullCmd = cmd;

		do {
			if (Object.prototype.hasOwnProperty.call(curCommands, cmd)) {
				commandHandler = curCommands[cmd];
			} else {
				commandHandler = undefined;
			}
			if (typeof commandHandler === 'string') {
				// in case someone messed up, don't loop
				commandHandler = curCommands[commandHandler];
			} else if (Array.isArray(commandHandler)) {
				return this.splitCommand(cmdToken + 'help ' + fullCmd.slice(0, -4));
			}
			if (commandHandler && typeof commandHandler === 'object') {
				let spaceIndex = target.indexOf(' ');
				if (spaceIndex > 0) {
					cmd = target.substr(0, spaceIndex).toLowerCase();
					target = target.substr(spaceIndex + 1);
				} else {
					cmd = target.toLowerCase();
					target = '';
				}

				fullCmd += ' ' + cmd;
				curCommands = commandHandler;
			}
		} while (commandHandler && typeof commandHandler === 'object');

		if (!commandHandler && curCommands.default) {
			commandHandler = curCommands.default;
			if (typeof commandHandler === 'string') {
				commandHandler = curCommands[commandHandler];
			}
		}
		this.cmd = cmd;
		this.cmdToken = cmdToken;
		this.target = target;
		this.fullCmd = fullCmd;

		return commandHandler;
	}
    parse(message) {
		this.bot.lastMessage = message.content;
		this.bot.lastUser = message.author;
		this.channel = message.channel;
		this.guild = message.guild;
		this.messageId = message.id;
		let commandHandler = this.splitCommand(message.content);
		if (typeof commandHandler === 'function') {
			if (toId(this.bot.lastUser.username) === toId(Config.name)) return; // Ignorar los  comandos dichos por el mismo bot
            const channel = message.channel;
            this.channel = channel;
            this.user = message.author;
            this.message = message.content;
            message = this.run(commandHandler);
		}
	}
    sendReply(data) {
        this.channel.send(data);
	}
	get lang() {
		let lang = (this.bot.language);
		return lang;
	}
	can(permission, broadcasting) {
		if (Chat.hasAuth(this.bot.id, this.user, permission)) return true;
		if (broadcasting) this.sendReply('Acceso Denegado');
		return false;
	}
	runHelp(help) {
		let commandHandler = this.splitCommand(`.help ${help}`);
		this.run(commandHandler);
	}
    run(commandHandler) {
        if (typeof commandHandler === 'string') commandHandler = this.bot.commands[commandHandler];
		let result;
		try {
			result = commandHandler.call(this, this.target, this.user, this.message);
		} catch (err) {
			Monitor.log(err, {
				user: this.user.username,
				message: this.message,
			}, 'Discord');
		}
		if (result === undefined) result = false;
		return result;
	}
}
module.exports = Parser;