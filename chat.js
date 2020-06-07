'use strict';

const Chat = (module.exports = {});

Chat.psCommands = Object.create(null);

Chat.globalCommands = Object.create(null);

Chat.discordCommands = Object.create(null);

Chat.packageData = {};

Chat.loadPlugins = function () {
	Plugins.FS('./package.json')
		.readTextIfExists()
		.then(data => {
			if (data) Chat.packageData = JSON.parse(data);
		});
	Plugins.loadPlugins();
	Object.assign(Chat.discordCommands, Chat.globalCommands);
	Object.assign(Chat.psCommands, Chat.globalCommands);
};

Chat.hasAuth = function (id, user, perm) {
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
		if (toId(Bot(id).name) === userId) {
			group = Bot(id).group;
		} else {
			group = user.charAt(0);
		}
		if (rank === group) return true;
		if (Config.rankList.indexOf(group) >= Config.rankList.indexOf(rank)) return true;
	}
	return false;
};
