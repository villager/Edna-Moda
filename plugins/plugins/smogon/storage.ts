import * as path from 'path';

import * as Api from './lib/api';

import * as Dex from './lib/dex';

const ABILITIES_DIR = path.resolve(__dirname, 'data', 'abilities.json');
const ITEMS_DIR = path.resolve(__dirname, 'data', 'items.json');
const MOVES_DIR = path.resolve(__dirname, 'data', 'moves.json');

export let abilities = Object.create(null);

export let items = Object.create(null);

export let moves = Object.create(null);

export const saveAbilities = () => Plugins.FS(ABILITIES_DIR).writeUpdate(() => JSON.stringify(abilities));
export const saveItems = () => Plugins.FS(ITEMS_DIR).writeUpdate(() => JSON.stringify(items));
export const saveMoves = () => Plugins.FS(MOVES_DIR).writeUpdate(() => JSON.stringify(moves));

export function loadData() {
	let fileData = [
		['abilities.json', abilities],
		['items.json', items],
		['moves.json', moves],
	];
	for (const file of fileData) {
		try {
			require.resolve(`./data/${file[0]}`);
		} catch (e) {
			Monitor.log(e);
		}
		try {
			let JSONdata = require(`./data/${file[0]}`);
			Object.assign(file[1], JSONdata);
		} catch (e) {
			Monitor.log(e);
		}
	}
}

export function localAbilitie(abilitie) {
	let psAbilitie = Plugins.Dex.getAbility(abilitie);
	if (abilities[abilitie]) return Promise.resolve(abilities[abilitie]);
	let spanish: any = Dex.searchSpanish(abilitie);
	if (spanish && spanish.type === 'Abilitie') {
		return Promise.resolve(abilities[spanish.iteration]);
	}
	return new Promise((resolve, reject) => {
		Api.searchAbilitie(psAbilitie.num)
			.then(data => {
				abilities[abilitie] = data;
				saveAbilities();
				resolve(data);
			})
			.catch(e => {
				reject(e);
			});
	});
}
export function localItem(item) {
	let psItem = Plugins.Dex.getItems(item);
	if (items[item]) return Promise.resolve(items[item]);
	let spanish: any = Dex.searchSpanish(item);
	if (spanish && spanish.type === 'Item') {
		return Promise.resolve(item[spanish.iteration]);
	}
	return new Promise((resolve, reject) => {
		Api.searchItem(psItem.spritenum)
			.then(data => {
				items[item] = data;
				saveItems();
				resolve(data);
			})
			.catch(e => {
				reject(e);
			});
	});
}
export function localMove(move) {
	let psMove = Plugins.Dex.getMoves(move);
	if (moves[move]) return Promise.resolve(moves[move]);
	let spanish: any = Dex.searchSpanish(move);
	if (spanish && spanish.type === 'Move') {
		return Promise.resolve(moves[spanish.iteration]);
	}
	return new Promise((resolve, reject) => {
		Api.searchItem(psMove.num)
			.then(data => {
				moves[move] = data;
				saveMoves();
				resolve(data);
			})
			.catch(e => {
				reject(e);
			});
	});
}
