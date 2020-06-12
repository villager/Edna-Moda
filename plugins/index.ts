import * as path from 'path';
import * as cluster from 'cluster';
import {FS} from '../lib/fs';
import {EventEmitter} from './utils/events';
import * as UtilLanguage from './utils/languages';
import * as UtilBins from './utils/bins';
import {UtilTimer} from './utils/timers';
import {GlobalUtility} from './utils/global';
import {UtilDex} from './utils/dex';
import {UtilNetwork} from './utils/net';
import {UtilBackup} from './utils/backup';

export const Plugins = new (class {
	plugins: AnyObject;
	psCommands: ChatCommands | null;
	discordCommands: ChatCommands | null;
	globalCommands: ChatCommands | null;
	packageData: AnyObject | null;
	constructor() {
		this.plugins = Object.create(null);
		this.psCommands = null;
		this.discordCommands = null;
		this.globalCommands = null;
		this.packageData = null;
	}
	get(plugin: string): AnyObject | Boolean {
		if (!this.plugins[plugin]) return false;
		return this.plugins[plugin];
	}
	private load(pluginPath: string) {
		const plugin = require('./plugins/' + pluginPath);
		if (!plugin || (typeof plugin !== 'object' && typeof plugin !== 'function')) {
			throw new Error('Plugin inválido: ´' + pluginPath + '´.');
		}
		plugin.id = pluginPath;
		if (!cluster.isMaster && !plugin.multiProcess) {
			Object.defineProperty(this.plugins, pluginPath, {
				value: plugin,
				enumerable: false,
				writable: true,
				configurable: true,
			});
			return;
		}
		return (this.plugins[pluginPath] = plugin);
	}
	forEach(callback: any, thisArg?: any) {
		return Object.values(this.plugins).forEach(callback, thisArg);
	}
	async init() {
		let pluginsList = this.FS(`./plugins/plugins`).readdirSync();
		for (const plugin of pluginsList) {
			this.load(plugin);
		}
		if (Config.isInitializacion) await this.initData();
		void this.forEach((plugin: AnyObject) => {
			if (typeof plugin.loadData === 'function') {
				if (!Config.testMode) plugin.loadData();
			}
		});
	}
	initCmds(): string[] {
		let cmds: string[] = [];
		Bot.forEach((bot: AnyObject) => {
			if (Array.isArray(bot.initCmds)) {
				cmds = cmds.concat(bot.initCmds);
			}
		});
		this.forEach((plugin: AnyObject) => {
			if (Array.isArray(plugin.initCmds)) {
				cmds = cmds.concat(plugin.initCmds);
			}
		});
		return cmds;
	}
	loadPlugins(): void {
		this.forEach((plugin: AnyObject) => {
			// The key is our king
			if (plugin.key) {
				if (Array.isArray(plugin.key)) {
					for (const key of plugin.key) {
						switch (key) {
							case 'global':
								Object.assign(this.globalCommands, plugin.globalCommands);
								break;
							case 'showdown':
								Object.assign(this.psCommands, plugin.psCommands);
								break;
							case 'discord':
								Object.assign(this.discordCommands, plugin.discordCommands);
								break;
						}
					}
				} else {
					if (plugin.commands && typeof plugin.commands === 'object') {
						switch (plugin.key) {
							case 'global':
								Object.assign(this.globalCommands, plugin.commands);
								break;
							case 'showdown':
								Object.assign(this.psCommands, plugin.commands);
								break;
							case 'discord':
								Object.assign(this.discordCommands, plugin.commands);
								break;
						}
					}
				}
			}
		});
	}
	loadCommands(): void {
		this.psCommands = Object.create(null);
		this.globalCommands = Object.create(null);
		this.discordCommands = Object.create(null);
		this.packageData = Object.create(null);
		void this.FS('./package.json')
			.readTextIfExists()
			.then((data: any) => {
				if (data) this.packageData = JSON.parse(data);
			});
		this.loadPlugins();
		Object.assign(this.discordCommands, this.globalCommands);
		Object.assign(this.psCommands, this.globalCommands);
	}
	hasAuth(id: string, user: string | any, perm: string): Boolean {
		let group;
		let userId = id === 'Discord' ? toUserName(user) : toId(user);
		for (const owner of Config.owners) {
			if (owner.id === userId) return true;
			for (const aliases of owner.aliases) {
				if (aliases === userId) return true;
			}
		}
		if (id === 'Discord') {
			return true; // I"ll do this latter
		} else {
			let rank = Config.permissions[perm];
			if (toId(Bot.get(id).name) === userId) {
				group = Bot.get(id).group;
			} else {
				group = user.charAt(0);
			}
			if (rank === group) return true;
			if (Config.rankList.indexOf(group) >= Config.rankList.indexOf(rank)) return true;
		}
		return false;
	}
	async initData() {
		const DATA_FOLDERS = ['data'];
		this.forEach((plugin: AnyObject) => {
			if (typeof plugin.initData === 'function') {
				plugin.initData();
			}
			for (const folder of DATA_FOLDERS) {
				this.FS(this.resolve('plugins', plugin.id, folder))
					.readdir()
					.then((files: any) => {
						let fileDict = Object.create(null);
						let exampleFiles = [];
						for (let fileName of files) {
							let ext = path.extname(fileName);
							let extFile = new Set(['.json', '.js', '.txt', '.tsv', '.csv', '.pem']);
							if (!extFile.has(ext)) continue;
							let name = fileName.slice(0, -ext.length);
							if (!fileDict[name]) fileDict[name] = Object.create(null);
							fileDict[name][ext] = 1;
							if (name.slice(-8) === '-example') exampleFiles.push({name: name.slice(0, -8), ext: ext});
						}
						for (let fileData of exampleFiles) {
							let baseFile = this.resolve('plugins', plugin.id, folder, fileData.name + fileData.ext);
							let originalFile = this.resolve(
								'plugins',
								plugin.id,
								folder,
								fileData.name + '-example' + fileData.ext,
							);
							this.FS(baseFile)
								.isFile()
								.catch(() => {
									console.log(`Creating file ${fileData.name}`);
									this.FS(baseFile).writeSync(FS(originalFile).readSync());
								});
						}
					})
					.catch(() => {});
			}
		});
	}
	/**
	 * Utils
	 */
	get FS() {
		return FS;
	}
	get Language() {
		return UtilLanguage;
	}
	get Timers() {
		return UtilTimer;
	}
	get Bins() {
		return UtilBins;
	}
	get Utils() {
		return GlobalUtility;
	}
	get Dex() {
		return UtilDex;
	}
	get Net() {
		return UtilNetwork;
	}
	get Backup() {
		return UtilBackup;
	}
	get eventEmitter() {
		// @ts-ignore
		return new EventEmitter();
	}
	resolve(...args: string[]) {
		return path.resolve(...args);
	}
	mapList(list: string[], lang: string): string {
		let output = `${list[0]}`;
		for (let i = 1; i + 1 < list.length; i++) {
			if (i === 1) output += ' ';
			output += ', ' + list[i];
		}
		let finalTxt = lang === 'spanish' ? ' y ' : ' and ';
		if (list.length > 1) {
			output += finalTxt + list[list.length - 1];
		}
		return output;
	}
})();
