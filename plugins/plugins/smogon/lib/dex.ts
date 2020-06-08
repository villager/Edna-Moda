import * as psData from 'ps-data';
import * as Storage from '../storage';

export function searchSpanish(lookingfor: string) {
	let found: any = false;
	lookingfor = toId(lookingfor);
	let lookingIn = [
		[Storage.moves, 'Move'],
		[Storage.abilities, 'Abilitie'],
	];
	for (const looking of lookingIn) {
		for (let i in looking[0]) {
			let data = looking[0][i];
			if (!data.spanish) continue;
			if (toId(data.spanish.name) === toId(lookingfor)) {
				found = {
					type: looking[1],
					iteration: i,
				};
				break;
			}
		}
		if (found) break;
	}
	return found;
}
export function searchTemplate(lookingfor: string) {
	lookingfor = toId(lookingfor);
	if (psData.getDex(8)[lookingfor]) {
		return 'Pokemon';
	} else if (psData.getAbilities(8)[lookingfor]) {
		return 'Abilitie';
	} else if (psData.getItems(8)[lookingfor]) {
		return 'Item';
	} else if (psData.getMoves(8)[lookingfor]) {
		return 'Move';
	} else if (searchSpanish(lookingfor)) {
		return searchSpanish(lookingfor).type;
	} else {
		return false;
	}
}
export const search = searchTemplate;

export function getGen(name: string, num: number) {
	name = name.toLowerCase();
	let gen;
	if (num > 1) {
		if (num >= 810 || ['gmax', 'galar', 'galar-Zen'].includes(name)) {
			gen = 8;
		} else if (num >= 722 || name.startsWith('alola') || name.endsWith('starter')) {
			gen = 7;
		} else if (name.endsWith('primal')) {
			gen = 6;
		} else if (num >= 650 || name.endsWith('mega')) {
			gen = 6;
		} else if (num >= 494) {
			gen = 5;
		} else if (num >= 387) {
			gen = 4;
		} else if (num >= 252) {
			gen = 3;
		} else if (num >= 152) {
			gen = 2;
		} else {
			gen = 1;
		}
	}
	return gen;
}
export function getPokemon(poke: string) {
	let data = psData.getDex(8)[poke];
	if (!data) return false;
	let abilities = [];
	for (let i in data.abilities) abilities.push(data.abilities[i]);
	return {
		stats: data.baseStats,
		num: data.num,
		name: data.name,
		types: data.types,
		abilities: abilities,
		color: data.color,
		eggs: data.eggGroups,
		evos: data.evos,
		gen: getGen(data.name, data.num),
	};
}
export function searchAbilitieByNum(num: number) {
	for (let i in psData.getAbilities(8)) {
		let abilitie = psData.getAbilities(8)[i];
		if (abilitie.num === num) return i;
	}
	return false;
}
export function getMove(move: string) {
	move = toId(move);
	return psData.getMoves(8)[move];
}
