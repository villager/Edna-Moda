import * as Storage from './storage';

export let teams = Object.create(null);

const mergeTeams = () => {
	for (let i in Storage.teams) {
		let team = Storage.teams[i];
		if (teams[team.format]) teams[team.format] = [];
		teams[team.format].push(team.packed);
	}
};

const addTeam = (name: string, format: string, packed: AnyObject) => {
	if (Storage.isSaved(name)) return false;
	Storage.teams[name] = {
		format: format,
		packed: packed,
	};
	Storage.saveTeams();
	mergeTeams();
	return true;
};

const removeTeam = (name: string) => {
	if (!Storage.isSaved(name)) return false;
	delete Storage.teams[name];
	Storage.saveTeams();
	mergeTeams();
	return true;
};
const getTeam = (format: string) => {
	let formatId = toId(format);
	let teamStuff = teams[formatId];
	if (!teamStuff || !teamStuff.length) return false;
	let teamChosen = teamStuff[Math.floor(Math.random() * teamStuff.length)]; //choose team
	let teamStr: any = '';
	try {
		if (typeof teamChosen === 'string') {
			//already parsed
			teamStr = teamChosen;
		} else if (typeof teamChosen === 'object') {
			if (teamChosen.maxPokemon && teamChosen.pokemon) {
				//generate random team
				let team = [];
				let pokes = teamChosen.pokemon.randomize();
				let k = 0;
				for (let i = 0; i < pokes.length; i++) {
					if (k++ >= teamChosen.maxPokemon) break;
					team.push(pokes[i]);
				}
				if (Config.debug.debug) console.log('Packed Team: ' + JSON.stringify(team));
				teamStr = packTeam(team);
			} else if (teamChosen.length) {
				//parse team
				teamStr = packTeam(teamChosen);
			} else {
				console.log('invalid team data type: ' + JSON.stringify(teamChosen));
				return false;
			}
		} else {
			console.log('invalid team data type: ' + JSON.stringify(teamChosen));
			return false;
		}
		return teamStr;
	} catch (e) {
		console.log(e.stack);
	}
};
const packTeam = (team: AnyObject[]) => {
	Plugins.Dex.packTeam(team);
};
const hasTeam = (format: string) => {
	let formatId = toId(format);
	if (teams[formatId]) return true;
	return false;
};

export const add = addTeam;
export const packed = packTeam;
export const remove = removeTeam;
export const merge = mergeTeams;
export const get = getTeam;
export const has = hasTeam;
