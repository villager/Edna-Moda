"use strict";

let challenges = {};
exports.challenges = challenges;

const Teams = require('./teams');

const Battle = require('./');


function canChallenge(server, i, nBattles) {
	if (!nBattles) return true; //If it is not busy, accept the challenge
    if (Config.battles.disable) return false;
    if (Config.battles.all) return true; //Acept all challenges if 'aceptAll' is enabled
	if (Config.battles.max && Config.battles.max > nBattles) return true; //If it is not in too many battles, accept the challenge
    if (Chat.hasAuth(server.id, i, 'driver')) return true;
	return false;
}

exports.parse = function (server, room, message, isIntro, spl) {
	if (spl[0] !== 'updatechallenges') return;
    //let nBattles = Object.keys(Battle.countBattles[server]).length;
    let nBattles = Battle.countBattles[server.id];
	try {
	    challenges = JSON.parse(message.substr(18));
    } catch (e) {return;}
    
	if (challenges.challengesFrom) {
		for (let i in challenges.challengesFrom) {
			if (canChallenge(server, i, nBattles)) {
				let format = challenges.challengesFrom[i];
				if (!(format in server.formats) || !server.formats[format].chall) {
					server.send('/reject ' + i);
					continue;
				}
				if (server.formats[format].team && !Teams.has(format)) {
					server.send('', '/reject ' + i);
					continue;
				}

				let team = Teams.get(format);
				if (team) {
					server.send('/useteam ' + team);
				}
				server.send('/accept ' + i);
				nBattles++;
			} else {
				server.send('/reject ' + i);
				//debug("rejected battle: " + i + " | " + exports.challenges.challengesFrom[i]);
				continue;
			}
		}
	}
};