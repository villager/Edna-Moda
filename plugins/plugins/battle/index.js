"use strict";

const Storage = require('./storage');
const Challenges = require('./challenges');
const Teams = require('./teams');
const BattleBot = require('./battle-ai');

let countBattles = Object.create(null);

Config.battles = {
    disable: false,
    max: 3,
    all: false,
};

function onParse(server, room, data, isIntro, spl) {
    switch (spl[0]) {
        case 'updatechallenges':
            Challenges.parse(server, room, data, isIntro, spl);
        break;
    }
	if (!server.rooms[room]) {
		if (spl[0] !== 'init' || spl[1] !== 'battle') {return}
	} else if (server.rooms[room].type !== "battle") {return}
    try {
		BattleBot.receive(server, room, data, isIntro);
	} catch (e) {
		Monitor.log(e, null, server);
	}
}
exports.loadData = Storage.loadData;

exports.init = function () {
    // Initialize countBattles
    Bot.forEach(bot => {
        countBattles[bot.id] = 0;
    });
    Teams.merge();
    BattleBot.init();
    Plugins.eventEmitter.on('PS_PARSE', onParse);
};
exports.countBattles = countBattles;