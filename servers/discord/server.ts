import {Parser} from './parser';

export class Server {
	idNum: number;
	name: string;
	id: string;
	language: string;
	commands: AnyObject;
	parser: any;
	constructor(guild) {
		this.idNum = guild.id;
		this.name = guild.name;
		this.id = toId(this.name);
		this.language = 'spanish';
		this.commands = Object.create(null);
		this.parser = new Parser(this);
		this.initPlugins();
	}
	loadCommands() {
		Plugins.loadCommands();
		Plugins.eventEmitter.emit('onDynamic', this).flush();
		Object.assign(this.commands, Plugins.discordCommands);
		this.parser.loadTopics();
	}
	initPlugins() {
		Plugins.forEach((plugin: AnyObject) => {
			if (typeof plugin.init === 'function') {
				plugin.init(this);
			}
		});
		this.loadCommands();
	}
}
