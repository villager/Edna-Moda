
export let psCommands = Object.create(null);

export let globalCommands = Object.create(null);

export let discordCommands = Object.create(null);

export let packageData = {};

export function loadPlugins() {
	Plugins.FS('./package.json')
		.readTextIfExists()
		.then((data: string) => {
			if (data) Chat.packageData = JSON.parse(data);
		});
	Plugins.loadPlugins();
	Object.assign(Chat.discordCommands, Chat.globalCommands);
	Object.assign(Chat.psCommands, Chat.globalCommands);
}

export function hasAuth(id: string, user: string | any, perm: string) {
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