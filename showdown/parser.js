"use strict";

class Parser {
	constructor(bot) {
        this.cmd = '';
        this.cmdToken = '';
        this.target = '';
        this.bot = bot;
		this.fullCmd = '';
        this.room = null;
        this.user = '';
        this.pmTarget = '';
		this.message = '';
		this.serverid = bot.id;
	}
	splitCommand(message) {
		this.cmd = '';
		this.cmdToken = '';
		this.target = '';
        if (!message || !message.trim().length) return;
        
		let cmdToken = message.charAt(0);
        if (Config.triggers.indexOf(cmdToken) === -1) return; 
		if (cmdToken === message.charAt(1)) return;
		let cmd = '', target = '';
		let spaceIndex = message.indexOf(' ');
		if (spaceIndex > 0) {
			cmd = message.slice(1, spaceIndex).toLowerCase();
			target = message.slice(spaceIndex + 1);
		} else {
			cmd = message.slice(1).toLowerCase();
			target = '';
		}

		let curCommands = Chat.psCommands;
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
	sendStrict(data) {
		if(this.pmTarget) {
			return this.bot.send(`/pm ${toId(this.pmTarget)}, ${data}`, toId(this.room));	
		} else {
			if(!this.can('games', false)) { // Can't brodcast
				return this.bot.send(`/pm ${toId(this.user)}, ${data}`, toId(this.room));
			} {
				return this.bot.send(data, toId(this.room));	
			}
		}		
	}
	sendReply(data) {
		if(this.pmTarget) {
			this.bot.send(`/pm ${toId(this.pmTarget)}, ${data}`, toId(this.room));	
		} else {
			this.bot.send(data, toId(this.room));			
		}
	}
	get lang() {
		let lang = this.room.language ? this.room.language : this.bot.language;
		return lang;
	}
	can(permission, broadcast) {
		if(Chat.hasAuth(this.bot.id, this.user, permission)) return true;
		if(broadcast) this.sendReply('Acceso Denegado');
		return false;
	}
    parse(room, user, message, pm) {
		this.pmTarget = '';
		this.bot.lastMessage = message;
		if(toId(this.bot.name) === toId(user)) this.bot.group = user.charAt(0);
		this.bot.lastUser = user;
		let commandHandler = this.splitCommand(message);
		if (typeof commandHandler === 'function') {
			if(toId(this.bot.lastUser) === toId(this.bot.name)) return; // Ignorar los  comandos dichos por el mismo bot
            this.user = user;
			this.message = message;
			this.room = room;
			if(pm) this.pmTarget = user;
        	this.run(commandHandler);
		}        
    }
	runHelp(help) {
		let commandHandler = this.splitCommand(`.help ${help}`);
		this.run(commandHandler);
	}
	runCmd(command) {
		let commandHandler = this.splitCommand(`.${command}`);
		this.run(commandHandler);
	}
	run(commandHandler) {
        if (typeof commandHandler === 'string') commandHandler = Chat.psCommands[commandHandler];
		let result;
		try {
			result = commandHandler.call(this, this.target, this.room, this.user, this.message);
		} catch (err) {
			Monitor.log(err,{
				user: this.user.id,
				message: this.message,
				pmTarget: this.pmTarget && this.pmTarget,
				room: this.room,
			}, this.bot.id);;
		}
		if (result === undefined) result = false;
		return result;      
    }
}
module.exports = Parser;