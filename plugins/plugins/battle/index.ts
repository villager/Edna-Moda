import * as Storage from './storage';
import * as Challenges from './challenges';
import * as Teams from './teams';
import * as BattleBot from './battle-ai';

export let countBattles = Object.create(null);

Config.battles = {
	disable: false,
	max: 3,
	all: false,
};

export function onParse(server, room, data, isIntro, spl) {
	switch (spl[0]) {
		case 'updatechallenges':
			Challenges.parse(server, room, data, isIntro, spl);
			break;
	}
	if (!server.rooms[room]) {
		if (spl[0] !== 'init' || spl[1] !== 'battle') {
			return;
		}
	} else if (server.rooms[room].type !== 'battle') {
		return;
	}
	try {
		BattleBot.receive(server, room, data, isIntro);
	} catch (e) {
		Monitor.log(e, null, server);
	}
}
export const loadData = Storage.loadData;

export function init() {
	// Initialize countBattles
	Bot.forEach(bot => {
		countBattles[bot.id] = 0;
	});
	Teams.merge();
	BattleBot.init();
	Plugins.eventEmitter.on('PS_PARSE', onParse);
}
