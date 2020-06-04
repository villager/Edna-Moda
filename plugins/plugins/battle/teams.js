"use strict";

const Storage = require("./storage");

let teams = Object.create(null);

function mergeTeams() {
	for (let i in Storage.teams) {
		let team = Storage.teams[i];
		if (teams[team.format]) teams[team.format] = [];
		teams[team.format].push(team.packed);
	}
}

function addTeam(name, format, packed) {
	if (Storage.isSaved(name)) return false;
	Storage.teams[name] = {
		format: format,
		packed: packed,
	};
	Storage.saveTeams();
	mergeTeams();
	return true;
}

function removeTeam(name) {
	if (!Storage.isSaved(name)) return false;
	delete Storage.teams[name];
	Storage.saveTeams();
	mergeTeams();
	return true;
}
function getTeam(format) {
	let formatId = toId(format);
	let teamStuff = teams[formatId];
	if (!teamStuff || !teamStuff.length) return false;
	let teamChosen = teamStuff[Math.floor(Math.random() * teamStuff.length)]; //choose team
	let teamStr = "";
	try {
		if (typeof teamChosen === "string") {
			//already parsed
			teamStr = teamChosen;
		} else if (typeof teamChosen === "object") {
			if (teamChosen.maxPokemon && teamChosen.pokemon) {
				//generate random team
				let team = [];
				let pokes = teamChosen.pokemon.randomize();
				let k = 0;
				for (let i = 0; i < pokes.length; i++) {
					if (k++ >= teamChosen.maxPokemon) break;
					team.push(pokes[i]);
				}
				if (Config.debug.debug) console.log("Packed Team: " + JSON.stringify(team));
				teamStr = packTeam(team);
			} else if (teamChosen.length) {
				//parse team
				teamStr = packTeam(teamChosen);
			} else {
				console.log("invalid team data type: " + JSON.stringify(teamChosen));
				return false;
			}
		} else {
			console.log("invalid team data type: " + JSON.stringify(teamChosen));
			return false;
		}
		return teamStr;
	} catch (e) {
		console.log(e.stack);
	}
}
function packTeam(team) {
	Plugins.Dex.packTeam(team);
}
function hasTeam(format) {
	let formatId = toId(format);
	if (teams[formatId]) return true;
	return false;
}

exports.add = addTeam;
exports.packed = packTeam;
exports.remove = removeTeam;
exports.merge = mergeTeams;
exports.get = getTeam;
exports.has = hasTeam;
