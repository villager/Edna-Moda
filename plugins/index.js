"use strict";

const cluster = require('cluster');
const path = require('path');

let plugins = Object.create(null);

function getPlugin(plugin) {
    if (!plugins[plugin]) return false;
    return plugins[plugin];
}

const Plugins = module.exports = getPlugin;

Plugins.plugins = plugins;

Plugins.load = function (pluginPath) {
    const plugin = require('./plugins/' + pluginPath);
	if (!plugin || typeof plugin !== 'object' && typeof plugin !== 'function') {
		throw new Error("Plugin inválido: ´" + pluginPath + "´.");
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
};

Plugins.forEach = function (callback, thisArg) {
	return Object.values(plugins).forEach(callback, thisArg);
};

const COMMANDS_MAP = new Map([
    ['showdown', 'psCommands'],
    ['discord', 'discordCommands'],
    ['global', 'globalCommands'],
]);
Plugins.init = function () {
    let pluginsList = Plugins.FS('./plugins/plugins').readdirSync();
    for (const plugin of pluginsList) {
        Plugins.load(plugin);
    }
    if (Config.isInitializacion) Plugins.initData();
    Plugins.forEach(plugin => {
        if (typeof plugin.loadData === 'function') {
            if (!Config.testMode) plugin.loadData();
        }
    });
};
Plugins.initCmds = function () {
    let cmds = [];
    Bot.forEach(bot => {
        if (Array.isArray(bot.initCmds)) {
            cmds = cmds.concat(bot.initCmds);
        }
    });
    Plugins.forEach(plugin => {
        if (Array.isArray(plugin.initCmds)) {
            cmds = cmds.concat(plugin.initCmds);
        }
    });
    return cmds;
};
Plugins.loadPlugins = function () {
    Plugins.forEach(plugin => {
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
};

function joinPath(...args) {
    return path.resolve(__dirname, ...args);
}
Plugins.initData = function () {
    const DATA_FOLDERS = ['data'];
	Plugins.forEach(plugin => {
        if (typeof plugin.initData === 'function') {
            plugin.initData();
        }
        for (const folder of DATA_FOLDERS) {
            Plugins.FS(joinPath('plugins', plugin.id, folder)).readdir().then(files => {
                let fileDict = Object.create(null);
                let exampleFiles = [];
                for (let fileName of files) {
                    let ext = path.extname(fileName);
                    if (ext !== '.json' && ext !== '.js' && ext !== '.txt' && ext !== '.tsv' && ext !== '.csv' && ext !== '.pem') continue;
                    let name = fileName.slice(0, -ext.length);
                    if (!fileDict[name]) fileDict[name] = Object.create(null);
                    fileDict[name][ext] = 1;
                    if (name.slice(-8) === '-example') exampleFiles.push({name: name.slice(0, -8), ext: ext});
                }
                for (let fileData of exampleFiles) {
                    let baseFile = joinPath('plugins', plugin.id, folder, fileData.name + fileData.ext);
                    let originalFile = joinPath('plugins', plugin.id, folder, fileData.name + '-example' + fileData.ext);
                    Plugins.FS(baseFile).isFile().catch(() => {
                        console.log(`Creating file ${fileData.name}`);
                        Plugins.FS(baseFile).writeSync(Plugins.FS(originalFile).readSync());
                    });
                }
            }).catch(() => {});
        }
    });
};

const events = require('./utils/events');
Plugins.FS = require('../lib/fs');
Plugins.Language = require('./utils/languages');
Plugins.Timers = require('./utils/timers');
Plugins.Bins = require('./utils/bins');
Plugins.Utils = require('./utils/global');
Plugins.Dex = require('./utils/dex');
Plugins.eventEmitter = new events.EventEmitter();