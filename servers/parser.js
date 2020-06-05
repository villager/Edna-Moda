"use strict";

class BaseParser {
	constructor(bot) {
		this.cmd = "";
		this.cmd = "";
		this.cmdToken = "";
		this.target = "";
		this.bot = bot;
		this.fullCmd = "";
		this.room = null;
		this.user = "";
		this.pmTarget = "";
		this.message = "";
		this.serverType = "";
	}
	get id() {
		return this.bot.id;
	}
	get lang() {
		return this.bot.language;
	}
	splitToken(message) {
		message = splint(message, " ");
		return message;
	}
	splitOne(target) {
		const commaIndex = target.indexOf(",");
		if (commaIndex < 0) {
			return [target.trim(), ""];
		}
		return [target.slice(0, commaIndex).trim(), target.slice(commaIndex + 1).trim()];
	}
	splitCommand(message) {
		this.cmd = "";
		this.cmdToken = "";
		this.target = "";
		this.pmTarget = "";
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
		let cmd = "",
			target = "";
		if (isWord) {
			let splitWords = this.splitToken(message);
			if (cmdToken === splitWords[1]) return;
			if (splitWords.length > 2) {
				cmd = splitWords[1];
				splitWords.splice(splitWords.indexOf(cmdToken), 1);
				splitWords.splice(splitWords.indexOf(cmd), 1);
				target = splitWords.join(" ");
			} else {
				message = message.split(" ");
				cmd = message[1];
				target = "";
			}
		} else {
			if (cmdToken === message.charAt(1)) return;
			let spaceIndex = message.indexOf(" ");
			if (spaceIndex > 0) {
				cmd = message.slice(1, spaceIndex).toLowerCase();
				target = message.slice(spaceIndex + 1);
			} else {
				cmd = message.slice(1).toLowerCase();
				target = "";
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
			if (typeof commandHandler === "string") {
				// in case someone messed up, don"t loop
				commandHandler = curCommands[commandHandler];
			} else if (Array.isArray(commandHandler)) {
				return this.splitCommand(cmdToken + "help " + fullCmd.slice(0, -4));
			}
			if (commandHandler && typeof commandHandler === "object") {
				let spaceIndex = target.indexOf(" ");
				if (spaceIndex > 0) {
					cmd = target.substr(0, spaceIndex).toLowerCase();
					target = target.substr(spaceIndex + 1);
				} else {
					cmd = target.toLowerCase();
					target = "";
				}

				fullCmd += " " + cmd;
				curCommands = commandHandler;
			}
		} while (commandHandler && typeof commandHandler === "object");

		if (!commandHandler && curCommands.default) {
			commandHandler = curCommands.default;
			if (typeof commandHandler === "string") {
				commandHandler = curCommands[commandHandler];
			}
		}
		this.cmd = cmd;
		this.cmdToken = cmdToken;
		this.target = target;
		this.fullCmd = fullCmd;

		return commandHandler;
	}
	can(permission, broadcast) {
		if (Chat.hasAuth(this.serverType, this.user, permission)) return true;
		if (broadcast) this.sendReply("Acceso Denegado");
		return false;
	}
	runHelp(help) {
		let commandHandler = this.splitCommand(`${this.cmdToken}help ${help}`);
		this.run(commandHandler);
	}
	runCmd(command) {
		let commandHandler = this.splitCommand(`${this.cmdToken}${command}`);
		this.run(commandHandler);
	}
	run(commandHandler) {
		let server, room;
		if (this.serverType === "Discord") {
			server = this.room.guild.name;
			room = this.room.name;
		} else {
			server = this.bot.id;
			room = toId(this.room);
		}
		if (typeof commandHandler === "string") commandHandler = this.bot.commands[commandHandler];
		let result;
		try {
			result = commandHandler.call(this, this.target, this.room, this.user, this.message);
		} catch (err) {
			Monitor.log(
				err,
				{
					user: this.user.username,
					message: this.message,
					room: room,
					serverType: this.serverType,
				},
				server,
			);
		}
		if (result === undefined) result = false;
		return result;
	}
}

module.exports = BaseParser;
