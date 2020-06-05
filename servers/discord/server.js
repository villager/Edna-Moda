"use strict";

const Parser = require("./parser");

class Server {
	constructor(guild) {
		this.idNum = guild.id;
		this.name = guild.name;
		this.id = toId(this.name);
		this.language = "english";
		this.commands = Object.create(null);
		this.parser = new Parser(this);
		this.initPlugins();
	}
	loadCommands() {
		Chat.loadPlugins();
		Plugins.eventEmitter.emit("onDynamic", this).flush();
		Object.assign(this.commands, Chat.discordCommands);
	}
	initPlugins() {
		Plugins.forEach(plugin => {
			if (typeof plugin.init === "function") {
				plugin.init(this);
			}
		});
		this.loadCommands();
	}
}
module.exports = Server;
