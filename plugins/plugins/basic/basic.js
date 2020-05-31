"use strict";

const Lang = Plugins.Language.load();

exports.key = ['global', 'showdown', 'discord'];

exports.globalCommands = {
    '?': 'help',
    h: 'help',
    help(target) {
		target = target.toLowerCase();

		// overall
		if (!target || target === 'help') {
			this.sendReply(".help o .h o .? - Te da ayuda.");
		} else {
			let altCommandHelp;
			let helpCmd;
			let targets = target.split(' ');
			let allCommands = this.bot.id === 'discord' ? Chat.discordCommands : Chat.psCommands;
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
				if(allCommands[helpCmd] === true) {
					const HelpLang = Plugins.Language.loadHelp();
					this.sendReply(HelpLang.get(this.lang, target));
				}
                /*if (Array.isArray(allCommands[helpCmd])) {
					this.sendReply(Lang.getSub(this.lang, target, 'msg'));
				}*/
			}
		}
	},
    version() {
		return this.sendReply(Lang.replace(this.lang, 'version', Chat.packageData.version));
    },
    say(target) {
        if(!target) return this.runHelp('say');
		this.sendReply(target);
    },
    sayhelp: true,
	eval(target) {
		if(!this.can('hotpatch', true)) return false;
		if(this.bot.id !== 'discord') {
			this.sendReply(`!code ${eval(target)}`);
		} else {
			this.sendReply(eval(target));
		}
	},
	uptime() {
		const uptime = process.uptime();
		let uptimeText;
		if (uptime > 24 * 60 * 60) {
		const uptimeDays = Math.floor(uptime / (24 * 60 * 60));
		uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
		const uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
		if (uptimeHours) uptimeText += ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
		} else {
		uptimeText = Tools.toDurationString(uptime * 1000);
		}
		this.sendReply("Uptime: **" + uptimeText + "**");
	},
    pick(target) {
        if (!target || !target.includes(',')) {
            return this.runHelp('pick');
        }
        const options = target.split(',');
		const pickedOption = options[Math.floor(Math.random() * options.length)].trim();
		this.sendReply(Lang.replace(this.lang, 'pick', pickedOption));
    },
    pickhelp: true,
};
exports.psCommands = {
    errorlog(target, room, user) {
        if(!this.can('hotpatch', true)) return false;
        let log = Tools.FS('../logs/errors.log').readSync().toString();
        Tools.Hastebin.upload(log, (r, link) => {
            let fullLink = 'https://' + link;
            if(r) this.sendReply(Lang.replaceSub(this.lang, 'errorlog', 'link',fullLink));
            else this.sendReply(Lang.getSub(this.lang, 'errorlog', 'error'));
        });
    },  
    about() {
        let version = Chat.packageData.url;
        let author = Chat.packageData.author && Chat.packageData.author.name;
        this.sendReply(Lang.replace(this.lang, 'about', this.bot.name,author, version));
    },
}
exports.discordCommands = {
	errorlog() {
		if(!this.can('hotpatch', true)) return false;
		let log = Tools.FS('../logs/errors.log').readSync().toString();
		Tools.Hastebin.upload(log, (r, link) =>{
			let fullLink = 'https://' + link;
			if(r) this.linkifyReply('Errores', 'Log de errores global del Bot', fullLink);
			else this.sendReply('Lo sentimos, no fue posible encontrar los logs');
		});
	},
    about() {
        let packageData = Chat.packageData;
        this.linkifyReply('Acerca de mi...',
        `Soy ${Config.name} un bot multi-plataforma creado 
        por ${packageData.author && packageData.author.name} para el servidor Space Showdown
        `, packageData.url);
    },    
}