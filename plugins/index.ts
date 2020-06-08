import * as path from 'path';
import * as cluster from 'cluster';
import {FS} from '../lib/fs';
import {EventEmitter} from './utils/events';
import * as UtilLanguage from './utils/languages';
import * as UtilBins from './utils/bins';
import {UtilTimer} from './utils/timers';
import * as UtilGlobal from './utils/global';
import * as UtilDex from './utils/dex';

const COMMANDS_MAP = new Map([
	['showdown', 'psCommands'],
	['discord', 'discordCommands'],
	['global', 'globalCommands'],
]);
export const Plugins = new class {
	plugins: AnyObject;
	constructor() {
		this.plugins = Object.create(null);
	}
	get(plugin: string) {
		if(!this.plugins[plugin]) return false;
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
		this.forEach((plugin: AnyObject) => {
			if (typeof plugin.loadData === "function") {
				if(!Config.testMode) plugin.loadData();
			}
		});
	}
	initCmds() {
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
	loadPlugins() {
		this.forEach((plugin: AnyObject) => {
			// The key is the king
			if (plugin.key) {
				if (Array.isArray(plugin.key)) {
					for (const key of plugin.key) {
						if (COMMANDS_MAP.has(key)) {
							Object.assign(Chat[COMMANDS_MAP.get(key)], plugin[COMMANDS_MAP.get(key)]);
						}
					}
				} else {
					if (plugin.commands && typeof plugin.commands === 'object') {
						Object.assign(Chat[COMMANDS_MAP.get(plugin.key)], plugin.commands);
					}
				}
			}
		});		
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
		return UtilGlobal;
	}
	get Dex() {
		return UtilDex;
	}
	get eventEmitter() {
		// @ts-ignore
		return new EventEmitter();
	}
	resolve(...args: string[]) {
		return path.resolve(__dirname, ...args);
	}
	join(...args: string[]) {
		return path.join(__dirname, ...args);
	}
}
