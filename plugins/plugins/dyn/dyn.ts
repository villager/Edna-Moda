let dyns = Object.create(null);

import {MessageEmbed} from 'discord.js';

import * as path from 'path';

const PHRASES_DIR = path.resolve(__dirname, 'data', 'data-dyn.json');

const Lang = Plugins.Language.load(path.resolve(__dirname, 'dyn-language.json'));

let saveDyns = () => Plugins.FS(PHRASES_DIR).writeUpdate(() => JSON.stringify(dyns));

export const key = ['global', 'discord', 'showdown'];

function loadCmdDyns(list, commandsHandler) {
	for (let i in list) {
		commandsHandler[i] = function () {
			this.sendReply(list[i].action);
		};
	}
}
function initDyns(server) {
	for (let i in dyns) {
		if (server.id === i) loadCmdDyns(dyns[i], server.commands);
	}
}
export const loadData = function () {
	try {
		require.resolve('./data/data-dyn.json');
	} catch (e) {
		Monitor.log(e);
	}
	try {
		let JSONdata = require('./data/data-dyn.json');
		Object.assign(dyns, JSONdata);
	} catch (e) {
		Monitor.log(e);
	}
};
export const init = function (server) {
	Plugins.eventEmitter.on('onDynamic', initDyns);
};
export const globalCommands: ChatCommands = {
	dyn(target) {
		if (!dyns[this.id]) return this.sendReply(Lang.get(this.lang, 'non_server_exist'));
		if (!dyns[this.id][target]) return this.sendReply(Lang.get(this.lang, 'non_exist'));
		this.sendReply(`Dyn: ${dyns[this.id][target].action}`);
	},
	setdyn(target) {
		if (!this.can('mute', true)) return false;
		if (!dyns[this.id]) dyns[this.id] = {};
		console.log(target);
		target = this.splitOne(target);
		console.log(target);
		if (dyns[this.id][target[0]]) return this.sendReply('Ya existe el comando indicado');
		if (!target[1]) return this.sendReply('especifica la accion');
		dyns[this.id][target[0]] = {
			action: target[1],
			aliases: [],
		};
		saveDyns();
		this.bot.commands[target[0]] = function () {
			this.sendReply(target[1]);
		};
		this.sendReply(`Dynamic command saved as ${target[0]}`);
	},
	deletedyn(target) {
		if (!this.can('mute', true)) return false;
		if (!dyns[this.id]) return false;
		if (!dyns[this.id][target]) return this.sendReply('El comando no existe');
		delete dyns[this.id][target];
		delete this.bot.commands[target]; // Delete handler
		saveDyns();
		this.sendReply(`You"ve delete dynamic command "${target}"`);
	},
};
export const discordCommands: ChatCommands = {
	dynlist: 'listdyn',
	listdyn() {
		if (!dyns[this.id]) return this.sendReply(Lang.get(this.lang, 'non_server_exist'));
		let data = '';
		data += Lang.get(this.lang, 'header') + '\n';
		for (let i in dyns[this.id]) {
			let dyn = dyns[this.id][i];
			data += `${i} -> ${dyn.action} `;
			if (dyn.aliases.length > 0) {
				data += '(';
				for (const alias of dyn.aliases) {
					data += alias + ', ';
				}
				data += ')';
			}
			data += '\n';
		}
		Plugins.Bins.upload(data, (r, link) => {
			if (r) {
				let embed = new MessageEmbed({
					title: Lang.get(this.lang, 'header'),
					url: link,
				});
				this.sendReply(embed);
			} else {
				this.sendReply(`${Lang.get(this.lang, 'list_error')}`);
			}
		});
	},
};
export const psCommands: ChatCommands = {
	dynlist: 'listdyn',
	listdyn() {
		if (!dyns[this.id]) return this.sendReply(Lang.get(this.lang, 'non_server_exist'));
		let data = '';
		data += Lang.get(this.lang, 'header') + '\n';
		for (let i in dyns[this.id]) {
			let dyn = dyns[this.id][i];
			data += `${i} -> ${dyn.action} `;
			if (dyn.aliases.length > 0) {
				data += '(';
				for (const alias of dyn.aliases) {
					data += alias + ', ';
				}
				data += ')';
			}
			data += '\n';
		}
		Plugins.Bins.upload(data, (r, link) => {
			if (r) {
				this.sendReply(`${Lang.get(this.lang, 'header')}: ${link}`);
			} else {
				this.sendReply(`${Lang.get(this.lang, 'list_error')}`);
			}
		});
	},
};
