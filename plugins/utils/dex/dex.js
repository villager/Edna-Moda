"use strict";

const Chart = require('./lib/chart');
const psData = require("ps-data");

exports.Chart = Chart;

exports.teamToJSON = function (text) {
	text = text.split("\n");
	var team = [];
	var curSet = null;
	for (var i = 0; i < text.length; i++) {
		var line = text[i].trim();
		if (line === '' || line === '---') {
			curSet = null;
		} else if (!curSet) {
			curSet = {name: '', species: '', gender: '', item: '', ability: '', nature: ''};
			team.push(curSet);
			var atIndex = line.lastIndexOf(' @ ');
			if (atIndex !== -1) {
				curSet.item = line.substr(atIndex + 3);
				if (toId(curSet.item) === 'noitem') curSet.item = '';
				line = line.substr(0, atIndex);
			}
			if (line.substr(line.length - 4) === ' (M)') {
				curSet.gender = 'M';
				line = line.substr(0, line.length - 4);
			}
			if (line.substr(line.length - 4) === ' (F)') {
				curSet.gender = 'F';
				line = line.substr(0, line.length - 4);
			}
			var parenIndex = line.lastIndexOf(' (');
			if (line.substr(line.length - 1) === ')' && parenIndex !== -1) {
				line = line.substr(0, line.length - 1);
				curSet.species = line.substr(parenIndex + 2);
				line = line.substr(0, parenIndex);
				curSet.name = line;
			} else {
				curSet.species = line;
				curSet.name = curSet.species;
			}
		} else if (line.substr(0, 7) === 'Trait: ') {
			line = line.substr(7);
			curSet.ability = line;
		} else if (line.substr(0, 9) === 'Ability: ') {
			line = line.substr(9);
			curSet.ability = line;
		} else if (line === 'Shiny: Yes') {
			curSet.shiny = true;
		} else if (line.substr(0, 7) === 'Level: ') {
			line = line.substr(7);
			curSet.level = parseInt(line);
		} else if (line.substr(0, 11) === 'Happiness: ') {
			line = line.substr(11);
			curSet.happiness = parseInt(line);
		} else if (line.substr(0, 9) === 'Ability: ') {
			line = line.substr(9);
			curSet.ability = line;
		} else if (line.substr(0, 5) === 'EVs: ') {
			line = line.substr(5);
			var evLines = line.split('/');
			curSet.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			for (var j = 0; j < evLines.length; j++) {
				var evLine = evLines[j].trim();
				var spaceIndex = evLine.indexOf(' ');
				if (spaceIndex === -1) continue;
				var statid = Chart.StatsId[evLine.substr(spaceIndex + 1)];
				var statval = parseInt(evLine.substr(0, spaceIndex));
				if (!statid) continue;
				curSet.evs[statid] = statval;
			}
		} else if (line.substr(0, 5) === 'IVs: ') {
			line = line.substr(5);
			var ivLines = line.split(' / ');
			curSet.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
			for (let j = 0; j < ivLines.length; j++) {
				let ivLine = ivLines[j];
				let spaceIndex = ivLine.indexOf(' ');
				if (spaceIndex === -1) continue;
				let statid = Chart.StatsId[ivLine.substr(spaceIndex + 1)];
				let statval = parseInt(ivLine.substr(0, spaceIndex));
				if (!statid) continue;
				curSet.ivs[statid] = statval;
			}
		} else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
			var natureIndex = line.indexOf(' Nature');
			if (natureIndex === -1) natureIndex = line.indexOf(' nature');
			if (natureIndex === -1) continue;
			line = line.substr(0, natureIndex);
			curSet.nature = line;
		} else if (line.substr(0, 1) === '-' || line.substr(0, 1) === '~') {
			line = line.substr(1);
			if (line.substr(0, 1) === ' ') line = line.substr(1);
			if (!curSet.moves) curSet.moves = [];
			if (line.substr(0, 14) === 'Hidden Power [') {
				var hptype = line.substr(14, line.length - 15);
				line = 'Hidden Power ' + hptype;
				if (!curSet.ivs) {
					curSet.ivs = {};
					for (let stat in Chart.Type[hptype].HPivs) {
						curSet.ivs[stat] = Chart.Type[hptype].HPivs[stat];
					}
				}
			}
			if (line === 'Frustration') {
				curSet.happiness = 0;
			}
			curSet.moves.push(line);
		}
	}
	return team;
};
exports.packTeam = function(team) {
	let buf = '';
	if (!team) return '';

	let hasHP;
	for (var i = 0; i < team.length; i++) {
		let set = team[i];
		if (buf) buf += ']';

		// name
		buf += set.name || set.species;

		// species
		let id = toId(set.species);
		buf += '|' + (toId(set.name || set.species) === id ? '' : id);

		// item
		buf += '|' + toId(set.item);

		// ability
		buf += '|' + toId(set.ability);

		// moves
		buf += '|';
		if (set.moves) for (var j = 0; j < set.moves.length; j++) {
			var moveid = toId(set.moves[j]);
			if (j && !moveid) continue;
			buf += (j ? ',' : '') + moveid;
			if (moveid.substr(0, 11) === 'hiddenpower' && moveid.length > 11) hasHP = true;
		}

		// nature
		buf += '|' + (set.nature || '');

		// evs
		var evs = '|';
		if (set.evs) {
			evs = '|' + (set.evs['hp'] || '') + ',' + (set.evs['atk'] || '') + ',' + (set.evs['def'] || '') + ',' + (set.evs['spa'] || '') + ',' + (set.evs['spd'] || '') + ',' + (set.evs['spe'] || '');
		}
		if (evs === '|,,,,,') {
			buf += '|';
			// doing it this way means packTeam doesn't need to be past-gen aware
			if (set.evs['hp'] === 0) buf += '0';
		} else {
			buf += evs;
		}

		// gender
		if (set.gender) {
			buf += '|' + set.gender;
		} else {
			buf += '|';
		}

		// ivs
		var ivs = '|';
		if (set.ivs) {
			ivs = '|' + (set.ivs['hp'] === 31 || set.ivs['hp'] === undefined ? '' : set.ivs['hp']) + ',' + (set.ivs['atk'] === 31 || set.ivs['atk'] === undefined ? '' : set.ivs['atk']) + ',' + (set.ivs['def'] === 31 || set.ivs['def'] === undefined ? '' : set.ivs['def']) + ',' + (set.ivs['spa'] === 31 || set.ivs['spa'] === undefined ? '' : set.ivs['spa']) + ',' + (set.ivs['spd'] === 31 || set.ivs['spd'] === undefined ? '' : set.ivs['spd']) + ',' + (set.ivs['spe'] === 31 || set.ivs['spe'] === undefined ? '' : set.ivs['spe']);
		}
		if (ivs === '|,,,,,') {
			buf += '|';
		} else {
			buf += ivs;
		}

		// shiny
		if (set.shiny) {
			buf += '|S';
		} else {
			buf += '|';
		}

		// level
		if (set.level && set.level != 100) {
			buf += '|' + set.level;
		} else {
			buf += '|';
		}

		// happiness
		if (set.happiness !== undefined && set.happiness !== 255) {
			buf += '|' + set.happiness;
		} else {
			buf += '|';
		}

		if (set.pokeball || (set.hpType && !hasHP)) {
			buf += ',' + (set.hpType || '');
			buf += ',' + toId(set.pokeball);
		}
	}

	return buf;    
};

exports.exportTeam = function (team) {
	if (!team) return "";
	if (typeof team === 'string') {
		if (team.indexOf('\n') >= 0) return team;
		team = fastUnpackTeam(team);
	}
	var text = '';
	for (var i = 0; i < team.length; i++) {
		var curSet = team[i];
		if (curSet.name !== curSet.species) {
			text += '' + curSet.name + ' (' + (getTemplate(curSet.species).name || curSet.species) + ')';
		} else {
			text += '' + (getTemplate(curSet.species).name || curSet.species);
		}
		if (curSet.gender === 'M') text += ' (M)';
		if (curSet.gender === 'F') text += ' (F)';
		if (curSet.item) {
			curSet.item = getItem(curSet.item).name || curSet.item;
			text += ' @ ' + curSet.item;
		}
		text += "\n";
		if (curSet.ability) {
			text += 'Ability: ' + curSet.ability + "\n";
		}
		if (curSet.level && curSet.level !== 100) {
			text += 'Level: ' + curSet.level + "\n";
		}
		if (curSet.shiny) {
			text += 'Shiny: Yes\n';
		}
		if (typeof curSet.happiness === 'number' && curSet.happiness !== 255) {
			text += 'Happiness: ' + curSet.happiness + "\n";
		}
		var first = true;
		if (curSet.evs) {
			for (var j in Chart.StatsName) {
				if (!curSet.evs[j]) continue;
				if (first) {
					text += 'EVs: ';
					first = false;
				} else {
					text += ' / ';
				}
				text += '' + curSet.evs[j] + ' ' + Chart.StatsName[j];
			}
		}
		if (!first) {
			text += "\n";
		}
		if (curSet.nature) {
			text += '' + curSet.nature + ' Nature' + "\n";
		}
		first = true;
		if (curSet.ivs) {
			var defaultIvs = true;
			var hpType = false;
			for (var j = 0; j < curSet.moves.length; j++) {
				var move = curSet.moves[j];
				if (move.substr(0, 13) === 'Hidden Power ' && move.substr(0, 14) !== 'Hidden Power [') {
					hpType = move.substr(13);
					if (!Chart.Type[hpType].HPivs) {
						continue;
					}
					for (var stat in Chart.StatsName) {
						if ((curSet.ivs[stat] === undefined ? 31 : curSet.ivs[stat]) !== (Chart.Type[hpType].HPivs[stat] || 31)) {
							defaultIvs = false;
							break;
						}
					}
				}
			}
			if (defaultIvs && !hpType) {
				for (var stat in Chart.StatsName) {
					if (curSet.ivs[stat] !== 31 && typeof curSet.ivs[stat] !== undefined) {
						defaultIvs = false;
						break;
					}
				}
			}
			if (!defaultIvs) {
				for (var stat in Chart.StatsName) {
					if (typeof curSet.ivs[stat] === 'undefined' || isNaN(curSet.ivs[stat]) || curSet.ivs[stat] === 31) continue;
					if (first) {
						text += 'IVs: ';
						first = false;
					} else {
						text += ' / ';
					}
					text += '' + curSet.ivs[stat] + ' ' + Chart.StatsName[stat];
				}
			}
		}
		if (!first) {
			text += "\n";
		}
		if (curSet.moves) {
			for (var j = 0; j < curSet.moves.length; j++) {
				var move = curSet.moves[j];
				if (move.substr(0, 13) === 'Hidden Power ') {
					move = move.substr(0, 13) + '[' + move.substr(13) + ']';
				}
				text += '- ' + (getMove(move).name || move) + "\n";
			}
		}
		text += "\n";
	}
	return text;
};


let fastUnpackTeam = exports.fastUnpackTeam = function (buf) {
	if (!buf) return [];

	var team = [];
	var i = 0, j = 0;

	while (true) {
		var set = {};
		team.push(set);

		// name
		j = buf.indexOf('|', i);
		set.name = buf.substring(i, j);
		i = j + 1;

		// species
		j = buf.indexOf('|', i);
		set.species = buf.substring(i, j) || set.name;
		i = j + 1;

		// item
		j = buf.indexOf('|', i);
		set.item = buf.substring(i, j);
		i = j + 1;

		// ability
		j = buf.indexOf('|', i);
		var ability = buf.substring(i, j);
		var template = getTemplate(set.species);
		set.ability = (template.abilities && ability in {'': 1, 0: 1, 1: 1, H: 1} ? template.abilities[ability || '0'] : ability);
		i = j + 1;

		// moves
		j = buf.indexOf('|', i);
		set.moves = buf.substring(i, j).split(',');
		i = j + 1;

		// nature
		j = buf.indexOf('|', i);
		set.nature = buf.substring(i, j);
		i = j + 1;

		// evs
		j = buf.indexOf('|', i);
		if (j !== i) {
			var evs = buf.substring(i, j).split(',');
			set.evs = {
				hp: Number(evs[0]) || 0,
				atk: Number(evs[1]) || 0,
				def: Number(evs[2]) || 0,
				spa: Number(evs[3]) || 0,
				spd: Number(evs[4]) || 0,
				spe: Number(evs[5]) || 0
			};
		}
		i = j + 1;

		// gender
		j = buf.indexOf('|', i);
		if (i !== j) set.gender = buf.substring(i, j);
		i = j + 1;

		// ivs
		j = buf.indexOf('|', i);
		if (j !== i) {
			var ivs = buf.substring(i, j).split(',');
			set.ivs = {
				hp: ivs[0] === '' ? 31 : Number(ivs[0]),
				atk: ivs[1] === '' ? 31 : Number(ivs[1]),
				def: ivs[2] === '' ? 31 : Number(ivs[2]),
				spa: ivs[3] === '' ? 31 : Number(ivs[3]),
				spd: ivs[4] === '' ? 31 : Number(ivs[4]),
				spe: ivs[5] === '' ? 31 : Number(ivs[5])
			};
		}
		i = j + 1;

		// shiny
		j = buf.indexOf('|', i);
		if (i !== j) set.shiny = true;
		i = j + 1;

		// level
		j = buf.indexOf('|', i);
		if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
		i = j + 1;

		// happiness
		j = buf.indexOf(']', i);
		if (j < 0) {
			if (buf.substring(i)) {
				set.happiness = Number(buf.substring(i));
			}
			break;
		}
		if (i !== j) set.happiness = Number(buf.substring(i, j));
		i = j + 1;
	}
	return team;
};

exports.teamOverview = function (buf) {
	var team = fastUnpackTeam(buf);
	if (!team) return '(empty)';
	var pokes = [];
	for (var i = 0; i < team.length; i++) {
		pokes.push(team[i].species);
	}
	if (!pokes.length) return '(empty)';
	return pokes.join(', ');
};

function getTemplate (name) {
	name = toId(name || '');
	try {
        return psData.getDex(8)[name] || {};
	} catch (e) {}
	return {};
};

function getItem (name) {
	name = toId(name || '');
	try {
        return psData.getItems(8)[name] || {};
	} catch (e) {}
	return {};
}

function getAbility (name) {
	name = toId(name || '');
	try {
        return psData.getAbilities(8)[name] || {};
	} catch (e) {}
	return {};
};

function getMove (name) {
	name = toId(name || '');
	try {
        return psData.getMoves(8)[name] || {}
	} catch (e) {}
	return {};
};

exports.getTemplate = getTemplate;
exports.getItem = getItem;
exports.getAbility = getAbility;
exports.getMove = getMove;