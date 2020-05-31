"use strict";

const cluster = require('cluster');

let plugins = Object.create(null);

function getPlugin(plugin) {
    if(!plugins[plugin]) return false;
    return plugins[plugin];
}

const Plugins = module.exports = getPlugin;

Plugins.plugins = plugins;
const KEYS_ACTION = [
    ['showdown', Chat.psCommands],
    ['discord', Chat.discordCommands],
    ['global', Chat.globalCommands], // This can be used in both sides
];
Plugins.load = function(pluginPath) {
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
}
Plugins.forEach = function(callback, thisArg) {
	return Object.values(plugins).forEach(callback, thisArg);
}
const COMMANDS_MAP = new Map([
    ['showdown', 'psCommands'],
    ['discord', 'discordCommands'],
    ['global', 'globalCommands'],
]);
Plugins.init = function() {
    let pluginsList = Tools.FS('./plugins/plugins').readdirSync();
    for (const plugin of pluginsList) {
        Plugins.load(plugin);
    }
};
Plugins.initCmds = function() {
    let cmds = [];
    Bot.forEach(bot => {
        if(Array.isArray(bot.initCmds)) {
            cmds = cmds.concat(bot.initCmds);
        }
    });
    Plugins.forEach(plugin => {
        if(Array.isArray(plugin.initCmds)) {
            cmds = cmds.concat(plugin.initCmds);
        }
    });
    return cmds;
};
Plugins.loadPlugins = function() {
    Plugins.forEach(plugin => {
        // The key is the king
        if(plugin.key) {
            if(Array.isArray(plugin.key)) {
                for (const key of plugin.key) {
                    if(COMMANDS_MAP.has(key)) {
                        Object.assign(Chat[COMMANDS_MAP.get(key)], plugin[COMMANDS_MAP.get(key)]);
                    }
                }
            } else {
                if (feature.commands && typeof feature.commands === 'object') {
                    Object.assign(Chat[COMMANDS_MAP.get(plugin.key)], plugin.commands);
                }     
            }
        }
    });
}

const events = require('./utils/events');

Plugins.Language = require('./utils/languages');

Plugins.eventEmitter = new events.EventEmitter();