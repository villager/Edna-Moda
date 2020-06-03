/*
* Tournaments points system
*/
"use strict";

const path = require('path');
const TOURS_DATA = path.resolve(__dirname, 'data', 'leaderboards.json');

let ladder = exports.ladder = {};

exports.load = function () {
	try {
		require.resolve('./data/leaderboards.json');
	} catch (e) {Monitor.log(e)}
	try {
		let JSONdata = require('./data/leaderboards.json');
		Object.assign(ladder, JSONdata);
	} catch (e) {Monitor.log(e)}
};

function isConfigured(server, room) {
    if (!server.leaderboards || !server.leaderboards[room]) return false;
    return true;
}
function filterTier(tier, filter) {
	tier = toId(tier || "");
	if (typeof filter === "string") {
		return (tier === toId(filter));
	} else if (filter !== null && typeof filter === "object") {
		if (filter instanceof Array) {
			if (filter.indexOf(tier) >= 0) return true;
			return false;
		} else if (filter instanceof RegExp) {
			return filter.test(tier);
		} else {
			if (tier in filter) return true;
			return false;
		}
	} else {
		return true;
	}
}

function getConfig(server, room) {
    let res = {
		tierFilter: null,
		onlyOfficial: false,
		winnerPoints: 5,
		finalistPoints: 3,
		semiFinalistPoints: 1,
		battlePoints: 0,
    };
    if (server.leaderboards && server.leaderboards[room]) {
        let SV_CONFIG = server.leaderboards[room];
        for (let i in res) {
            if (SV_CONFIG[i]) res[i] = SV_CONFIG[i];
        }
    }
    return res;
}

function parseTourTree(tree) {
	let auxobj = {};
	let team = tree.team;
	let state = tree.state;
	let children = tree.children;
	if (!children) children = [];
	if (!auxobj[team]) auxobj[team] = 0;
	if (state && state === "finished") {
		auxobj[team] += 1;
	}
    for (const c of children) {
        let aux = parseTourTree(c);
        for (let i in aux) {
            if (!auxobj[i]) auxobj[i] = 0;
        }
    }
	return auxobj;
}

function parseTournamentResults(data) {
	let generator = toId(data.generator || "");
	if (generator === "singleelimination") {
		let res = {};
		let parsedTree = parseTourTree(data.bracketData.rootNode);
		res.players = Object.keys(parsedTree);
		res.general = {};
		for (let i in parsedTree) res.general[toId(i)] = parsedTree[i];
		//winners
		res.winner = toId(data.results[0][0]);
		res.finalist = "";
		res.semiFinalists = [];
		if (data.bracketData.rootNode.children) {
            for (const dataChildren of data.bracketData.rootNode.children) {
                let aux = toId(dataChildren.team || '');
                if (aux && aux !== res.winner) {
                    res.finalist = aux;
                }
                if (dataChildren.children) {
                    for (const superChildren of dataChildren.children) {
                        let aux2 = toId(superChildren.team);
                        if (aux && aux2 !== res.winner && aux2 !== res.finalist && res.semiFinalists.indexOf(aux2) < 0) {
                            res.semiFinalists.push(aux2);
                        }
                    }
                }
            }
		}
		return res;
	} else {
		Monitor.debug("Incompatible generator: " + data.generator);
		return null; //Not compatible generator
	}
}

function getPoints(server, room, user) {
	let userid = toId(user);
	let roomConfig = getConfig(server, room);
	let pWin = roomConfig.winnerPoints;
	let pFinal = roomConfig.finalistPoints;
	let pSemiFinal = roomConfig.semiFinalistPoints;
	let pBattle = roomConfig.battlePoints;
	let res = {
		name: user,
		room: room,
		wins: 0,
		finals: 0,
		semis: 0,
		battles: 0,
		tours: 0,
		points: 0,
    };
	if (!ladder[server.id][room] || !ladder[server.id][room][userid]) return res;
	res.name = ladder[server.id][room][userid][0];
	res.wins = ladder[server.id][room][userid][1];
	res.finals = ladder[server.id][room][userid][2];
	res.semis = ladder[server.id][room][userid][3];
	res.battles = ladder[server.id][room][userid][4];
	res.tours = ladder[server.id][room][userid][5];
	res.points = (pWin * res.wins) + (res.finals * pFinal) + (res.semis * pSemiFinal) + (res.battles * pBattle);
	return res;
}
function getTop(server, room) {
	if (!isConfigured(server, room)) return null;
	let roomConfig = getConfig(server, room);
	let pWin = roomConfig.winnerPoints;
	let pFinal = roomConfig.finalistPoints;
	let pSemiFinal = roomConfig.semiFinalistPoints;
	let pBattle = roomConfig.battlePoints;
	if (!ladder[server.id][room]) return [];
	let top = [];
	let points = 0;
	for (let u in ladder[server.id][room]) {
		points = (pWin * ladder[server.id][room][u][1]) + (pFinal * ladder[server.id][room][u][2]) + (pSemiFinal * ladder[server.id][room][u][3]) + (pBattle * ladder[server.id][room][u][4]);
		top.push(ladder[server.id][room][u].concat([points]));
	}
	return top.sort(function (a, b) {
		if (a[6] !== b[6]) return b[6] - a[6]; //Points
		if (a[1] !== b[1]) return b[1] - a[1]; //Wins
		if (a[2] !== b[2]) return b[2] - a[2]; //Finals
		if (a[3] !== b[3]) return b[3] - a[3]; //Semis
		if (a[4] !== b[4]) return b[4] - a[4]; //Battles
		if (a[5] !== b[5]) return b[5] - a[5]; //Tours played
		return 0;
	});
}

function getTable(server, room, n) {
	if (!isConfigured(server, room)) return null;
	let top = getTop(server, room);
	if (!top) return null;
	let table = "Room: " + room + "\n\n";
	table += " N\u00BA | Name | Ranking | W | F | SF | Tours Played | Battles won\n";
	table += "----|------|---------|---|---|----|-------------|-------------\n";
	for (let i = 0; i < n && i < top.length; i++) {
		table += (i + 1) + " | " + top[i][0] + " | " + top[i][6] + " | " + top[i][1] + " | " + top[i][2] + " | " + top[i][3] + " | " + top[i][5] + " | " + top[i][4];
		table += "\n";
	}
	return table;
}
function addUser(server, room, user, type, auxData) {
    if (!ladder[server.id]) ladder[server.id] = {};
    if (!ladder[server.id][room]) ladder[server.id][room] = {};
	let userid = toId(user);
	if (!ladder[server.id][room][userid]) ladder[server.id][room][userid] = [user, 0, 0, 0, 0, 0];
	switch (type) {
		case 'A':
			ladder[server.id][room][userid][0] = user; //update user name
			ladder[server.id][room][userid][5]++;
			break;
		case 'W':
			ladder[server.id][room][userid][1]++;
			break;
		case 'F':
			ladder[server.id][room][userid][2]++;
			break;
		case 'S':
			ladder[server.id][room][userid][3]++;
			break;
		case 'B':
			let val = parseInt(auxData);
			if (!val) return;
			ladder[server.id][room][userid][4] += val;
			break;
	}
}


function writeResults(server, room, results) {
	if (!results) return;
	for (let i = 0; i < results.players.length; i++) addUser(server, room, results.players[i], 'A');
	if (results.winner) addUser(server, room, results.winner, 'W');
	if (results.finalist) addUser(server, room, results.finalist, 'F');
	for (let i = 0; i < results.semiFinalists.length; i++) addUser(server, room, results.semiFinalists[i], 'S');
	for (let user in results.general) addUser(server, room, user, 'B', results.general[user]);
}
function onTournamentEnd(server, room, data) {
	if (!isConfigured(server, room)) return;
	if (!data.isOfficialTour) {
		//debug(JSON.stringify(getConfig(room)));
		if (getConfig(server, room).onlyOfficial) {
			Monitor.debug("Discarded tour because it is not official. Tier: " + data.format + " | Room: " + room);
			return;
		}
		let filter = getConfig(server, room).tierFilter;
		if (!filterTier(data.format, filter)) {
			Monitor.debug("Discarded tour because of tier filter. Tier: " + data.format + " | Room: " + room);
			return;
		}
	}
	let results = parseTournamentResults(data);
	//console.log(JSON.stringify(results));
	if (!results) return;
	Monitor.debug("Updating leaderboard...");
	writeResults(server, room, results);
	Plugins.FS(TOURS_DATA).writeUpdate(() => JSON.stringify(ladder));
	Monitor.debug("Leaderboard updated. " + Plugins.getDateString());
}

let resetCodes = exports.resetCodes = {};

function getResetHashCode(server, room) {
	if (!ladder[server.id][room]) return null;
	for (let i in resetCodes) {
		if (resetCodes[server.id][i] === room) delete resetCodes[server.id][i];
	}
	let code = Plugins.generateRandomNick(10);
	resetCodes[server.id][code] = room;
	return code;
}
function execResetHashCode(server, code) {
	if (resetCodes[server.id][code]) {
		let room = resetCodes[code];
		if (ladder[server.id][room]) {
			delete ladder[server.id][room];
            Plugins.FS(TOURS_DATA).writeUpdate(() => JSON.stringify(ladder));
		}
		delete resetCodes[code];
		return room;
	}
	return false;
}
exports.isConfigured = isConfigured;
exports.filterTier = filterTier;
exports.parseTourTree = parseTourTree;
exports.getConfig = getConfig;
exports.parseTournamentResults = parseTournamentResults;
exports.getPoints = getPoints;
exports.getTop = getTop;
exports.getTable = getTable;
exports.addUser	= addUser;
exports.writeResults = writeResults;
exports.onTournamentEnd = onTournamentEnd;
exports.getResetHashCode = getResetHashCode;
exports.execResetHashCode = execResetHashCode;