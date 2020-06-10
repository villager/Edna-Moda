/**
 *  Main File
 */

if (!global.Config) global.Config = require('../config/config');

declare const global: any;

import {Plugins} from '../plugins';

global.Plugins = Plugins;

import {Monitor} from '../lib/monitor';

global.Monitor = Monitor;

const Discord: any | null = null;

export const Bot = new (class {
	bots: AnyObject;
	constructor() {
		this.bots = Object.create(null);
	}
	get(bot: string) {
		if (!this.bots[bot]) {
			if (Discord && Discord.get(bot)) {
				return Discord.get(bot);
			} else {
				return false;
			}
		} else {
			return this.bots[bot];
		}
	}
	forEach(callback: any, thisArg?: any) {
		Object.values(this.bots).forEach(callback, thisArg);
	}
	yallEach(callback: any, thisArg?: any) {
		Object.values(this.bots).forEach(callback, thisArg);
		if (Discord) {
			Discord.servers.forEach(callback, thisArg);
		}
	}
})();
global.Bot = Bot;
global.toId = Plugins.Utils.toId;
global.splint = Plugins.Utils.splint;
global.toName = Plugins.Utils.toName;
global.toUserName = Plugins.Utils.toUserName;
// @ts-ignore
Plugins.init();

const listeners: number = (Object.keys(Config.servers).length + 1) * Object.keys(Plugins.plugins).length;
Plugins.eventEmitter.setMaxListeners(listeners);

import {PSClient} from './showdown';
import {DiscordClient} from './discord';

interface ServerHolder {
	[k: string]: PSClient;
}

class GBot {
	discord: DiscordClient | null;
	servers: ServerHolder;
	constructor() {
		this.discord = null;
		if (Config.token && Config.name) {
			this.discord = global.Discord = new DiscordClient();
		}
		this.servers = Object.create(null);
		for (const i in Config.servers) {
			const Server = Config.servers[i];
			this.servers[i] = Bot.bots[i] = new PSClient(Server);
		}
	}
	connect() {
		for (const i in this.servers) {
			const Server = this.servers[i];
			Server.connect();
			/* Bot Status events */
			Server.on('connecting', () => {
				console.log('Connecting to server: ' + Server.id + ':' + Server.port);
			});
			Server.on('connect', () => {
				console.log('Bot connected to server: ' + Server.id + ':' + Server.port);
			});
			Server.on('disconnect', err => {
				console.log('Bot Disconnected' + (err ? ' | ' + err.code + ': ' + err.message : ''));
				if (Server.manager.closed || Server.manager.connecting || Server.manager.status.connected) return;
				if (!Config.testMode) {
					Server.manager.onBegin();
				} else {
					console.log('Sever in a test mode');
				}
			});
			Plugins.loadCommands();
		}
		if (this.discord) this.discord.connect();
	}
}
const GlobalBot = (global.GlobalBot = new GBot());

GlobalBot.connect();
