import * as path from 'path';
import * as cluster from 'cluster';

export let plugins = Object.create(null);

function getPlugin(plugin: string) {
	if (!plugins[plugin]) return false;
	return plugins[plugin];
}

export const get = getPlugin;

export function load(pluginPath: string) {
	const plugin = require('./plugins/' + pluginPath);
	if (!plugin || (typeof plugin !== 'object' && typeof plugin !== 'function')) {
		throw new Error('Plugin inválido: ´' + pluginPath + '´.');
	}
	plugin.id = pluginPath;
	if (!cluster.isMaster && !plugin.multiProcess) {
		Object.defineProperty(plugins, pluginPath, {
			value: plugin,
			enumerable: false,
			writable: true,
			configurable: true,
		});
		return;
	}
	return (plugins[pluginPath] = plugin);
}
export function forEach(callback:any, thisArg?: any) {
	return Object.values(plugins).forEach(callback, thisArg);
}

const COMMANDS_MAP = new Map([
	['showdown', 'psCommands'],
	['discord', 'discordCommands'],
	['global', 'globalCommands'],
]);

export function init() {
	let pluginsList = Plugins.FS('./plugins/plugins').readdirSync();
	for (const plugin of pluginsList) {
		Plugins.load(plugin);
	}
	if (Config.isInitializacion) Plugins.initData();
	Plugins.forEach((plugin: AnyObject) => {
		if (typeof plugin.loadData === 'function') {
			if (!Config.testMode) plugin.loadData();
		}
	});
}

export function initCmds() {
	let cmds: string[] = [];
	Bot.forEach((bot: AnyObject) => {
		if (Array.isArray(bot.initCmds)) {
			cmds = cmds.concat(bot.initCmds);
		}
	});
	forEach((plugin: AnyObject) => {
		if (Array.isArray(plugin.initCmds)) {
			cmds = cmds.concat(plugin.initCmds);
		}
	});
	return cmds;
}
export function loadPlugins() {
	forEach((plugin: AnyObject) => {
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

export const FS = require('../lib/fs').FS;

function joinPath(...args: string[]) {
	return path.resolve(__dirname, ...args);
}
export function initData() {
	const DATA_FOLDERS = ['data'];
	forEach((plugin: AnyObject) => {
		if (typeof plugin.initData === 'function') {
			plugin.initData();
		}
		for (const folder of DATA_FOLDERS) {
			FS(joinPath('plugins', plugin.id, folder))
				.readdir()
				.then((files: string[]) => {
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
						let baseFile = joinPath('plugins', plugin.id, folder, fileData.name + fileData.ext);
						let originalFile = joinPath(
							'plugins',
							plugin.id,
							folder,
							fileData.name + '-example' + fileData.ext,
						);
						Plugins.FS(baseFile)
							.isFile()
							.catch(() => {
								console.log(`Creating file ${fileData.name}`);
								FS(baseFile).writeSync(FS(originalFile).readSync());
							});
					}
				})
				.catch(() => {});
		}
	});
}

import * as events from './utils/events';
import * as UtilLanguage from './utils/languages';
import * as UtilBins from './utils/bins';
import {UtilTimer} from './utils/timers';
import * as UtilGlobal from './utils/global';
import * as UtilDex from './utils/dex';

export const Language = UtilLanguage;
export const Timers = UtilTimer;
export const Bins = UtilBins;
export const Utils = UtilGlobal;
export const Dex = UtilDex;
// @ts-ignore
export const eventEmitter = new events.EventEmitter();