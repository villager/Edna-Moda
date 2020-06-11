const Lang = Plugins.Language.load();

const LANG_LIST = new Set(['en', 'es']);
const SPANISH_ALIASES = new Set(['es', 'spanish', 'español', 'espaol', 'espanol']);
const ENGLISH_ALIASES = new Set(['en', 'ing', 'ingles', 'us', 'uk', 'english']);
const {MessageEmbed} = require('discord.js');

export const key = 'global';

export const commands: ChatCommands = {
	'?': 'help',
	h: 'help',
	help(target) {
		target = target.toLowerCase();

		// overall
		if (!target || target === 'help') {
			this.sendReply('.help o .h o .? - Te da ayuda.');
		} else {
			let altCommandHelp;
			let helpCmd;
			let targets = target.split(' ');
			let allCommands = this.bot.commands;
			if (typeof allCommands[target] === 'string') {
				// If a function changes with command name, help for that command name will be searched first.
				altCommandHelp = target + 'help';
				if (altCommandHelp in allCommands) {
					helpCmd = altCommandHelp;
				} else {
					helpCmd = allCommands[target] + 'help';
				}
			} else if (targets.length > 1 && typeof allCommands[targets[0]] === 'object') {
				// Handle internal namespace commands
				let helpCmd = targets[targets.length - 1] + 'help';
				let namespace = allCommands[targets[0]];
				for (let i = 1; i < targets.length - 1; i++) {
					if (!namespace[targets[i]]) return;
					namespace = namespace[targets[i]];
				}
				if (typeof namespace[helpCmd] === 'object') {
					return this.sendReply(namespace[helpCmd].join('\n'));
				}
			} else {
				helpCmd = target + 'help';
			}
			if (helpCmd in allCommands) {
				if (allCommands[helpCmd] === true) {
					const HelpLang = Plugins.Language.loadHelp();
					this.sendReply(HelpLang.get(this.lang, target));
				}
				/*if (Array.isArray(allCommands[helpCmd])) {
					this.sendReply(Lang.get(this.lang, {msg: target, in: "msg"}));
				}*/
			}
		}
	},
	helptopic: 'info',
	version() {
		return this.sendReply(Lang.get(this.lang, 'version', Plugins.packageData.version));
	},
	versiontopic: 'info',
	say(target) {
		if (!target) return this.runHelp('say');
		this.sendReply(target);
	},
	sayhelp: true,
	saytopic: 'dynamic',
	eval(target) {
		if (!this.can('hotpatch', true)) return false;
		let result = eval(target);
		try {
			if (this.serverType !== 'Discord') {
				this.sendReply(`!code ${result}`);
			} else {
				this.sendReply(result);
			}
		} catch (e) {
			const message = ('' + e.stack).replace(/\n *at CommandContext\.eval [\s\S]*/m, '').replace(/\n/g, '\n||');
			if (this.serverType !== 'Discord') {
				this.sendReply(`!code ${message}`);
			} else {
				this.sendReply(message);
			}
		}
	},
	evaltopic: 'owner',
	errorlog() {
		if (!this.can('hotpatch', true)) return false;
		let log = Plugins.FS('./logs/errors.log').readSync().toString();
		Plugins.Bins.upload(log, (r, link) => {
			if (r) {
				this.isDiscord.then(() => {
					let data = new MessageEmbed({
						title: 'Errores',
						description: 'Log de errores del Bot',
						url: link,
					});
					this.sendReply(data);
				}).catch(() => {
					this.sendReply(Lang.get(this.lang, {msg: 'errorlog', in: 'link'}, link));
				});
			} else {
				this.sendReply(Lang.get(this.lang, {msg: 'errorlog', in: 'error'}));
			}
		});
	},
	errorlogtopic: 'admin',
	uptime() {
		const uptime = process.uptime();
		let uptimeText;
		if (uptime > 24 * 60 * 60) {
			const uptimeDays = Math.floor(uptime / (24 * 60 * 60));
			uptimeText = uptimeDays + ' ' + (uptimeDays === 1 ? 'day' : 'days');
			const uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
			if (uptimeHours) uptimeText += ', ' + uptimeHours + ' ' + (uptimeHours === 1 ? 'hour' : 'hours');
		} else {
			uptimeText = Plugins.Utils.toDurationString(uptime * 1000);
		}
		this.sendReply('Uptime: **' + uptimeText + '**');
	},
	uptimetopic: 'info',
	pick(target) {
		if (!target || !target.includes(',')) {
			return this.runHelp('pick');
		}
		const options = target.split(',');
		const pickedOption = options[Math.floor(Math.random() * options.length)].trim();
		this.sendReply(Lang.get(this.lang, 'pick', pickedOption));
	},
	pickhelp: true,
	picktopic: 'dynamic',
	about() {
		let url = Plugins.packageData.url;
		let author = Plugins.packageData.author && Plugins.packageData.author.name;
		this.isDiscord.then(() => {
			let data = new MessageEmbed({
				title: Lang.get(this.lang, 'bout_me'),
				description: Lang.get(this.lang, 'about_cord', Config.name, author),
				url: url,
			});
			this.sendReply(data);
		}).catch(() => {
			this.sendReply(Lang.get(this.lang, 'about', this.bot.name, author, url));
		});
	},
	abouttopic: 'info',
	language(target, room) {
		if (this.serverType === 'Discord') return; // Nothing to report here
		if (!this.can('invite', true)) return false;
		if (!target) return this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'target'}));
		if (!LANG_LIST.has(target) && !SPANISH_ALIASES.has(target) && !ENGLISH_ALIASES.has(target)) {
			return this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'unavileable'}));
		}
		if (SPANISH_ALIASES.has(target)) {
			if (room.language === 'es') return this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'alr_es'}));
			this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'now_es'}));
			room.language = 'es';
		}
		if (ENGLISH_ALIASES.has(target)) {
			if (room.language === 'en') return this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'alr_en'}));
			this.sendReply(Lang.get(this.lang, {msg: 'language', in: 'now_en'}));
			room.language = 'en';
		}
	},
	languagetopic: 'settings',
};
