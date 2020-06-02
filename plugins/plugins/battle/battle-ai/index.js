"use strict";

const Battle = require('./battle');
const Storage = require('../storage');
let battles = Object.create(null);
let battlesCount = 0;


function updateJoins() {
    for (let x in battles) {
		for (let i in battles[x]) {
			Storage.autoJoin[x][i] = 1;
		}
	}  
}
exports.init = function() {
    for (let i in battles) { 
		for (let x in battles[i]) {
			try {
				battles[i][x].destroy();
			} catch(e) {}
			delete battles[i][x];
		} 
    }  
    battlesCount = 0;
};
exports.receive = function(server, room, data, isIntro) {
    if (data.charAt(0) === ">") return;
	let spl = data.substr(1).split("|");
    if(!battles[server.id]) battles[server.id] = {};
	if (spl[0] === 'init') {
		if (battles[server.id][room]) {
			try {
				battles[server.id][room].destroy();
			} catch (e) {}
		}
		battles[server.id][room] = new Battle(server, room);
		battlesCount++;
		updateJoins();
	}
	if (battles[server.id][room]) {
		battles[server.id][room].add(data, isIntro);
	}
	if (spl[0] === 'deinit' || spl[0] === 'expire') {
		if (battles[server.id][room]) {
			try {
				battles[server.id][room].destroy();
			} catch (e) {}
			delete battles[server.id][room];
			battlesCount--;
			updateJoins();
		}
	}   
};
exports.tryAbanoned = function() {
	if (!Config.abandonedBattleAutojoin) return;
	let cmds = [];
	for (let i in Storage.autoJoin) {
		for (let x in Storage.autoJoin[i]) {
			if(!battles[i][x]) {
				cmds.push(`/join ${x}`);
				cmds.push(`/joinbattle ${x}`);

			}
			delete Storage.autoJoin[i][x];
		}
    }
    Storage.saveJoins();
	return cmds;
};