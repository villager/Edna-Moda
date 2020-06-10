import * as Api from './lib/api';

import {Dex} from './lib/dex';

const ABILITIES_DIR = Plugins.resolve(__dirname, 'data', 'data-abilities.json');
const ITEMS_DIR = Plugins.resolve(__dirname, 'data', 'data-items.json');
const MOVES_DIR = Plugins.resolve(__dirname, 'data', 'data-moves.json');

export class PokeStorage {
	abilities: AnyObject;
	items: AnyObject;
	moves: AnyObject;
	readonly fileList: string[];
	constructor() {
		this.abilities = Object.create(null);
		this.items = Object.create(null);
		this.moves = Object.create(null);
		this.fileList = ['data-abilities.json', 'data-items.json', 'data-moves.json'];
	}
	save(arg: string): void {
		if (arg === 'Abilitie') {
			Plugins.FS(ABILITIES_DIR).writeUpdate(() => JSON.stringify(this.abilities));
		} else if (arg === 'Item') {
			Plugins.FS(ITEMS_DIR).writeUpdate(() => JSON.stringify(this.items));
		} else if (arg === 'Move') {
			Plugins.FS(MOVES_DIR).writeUpdate(() => JSON.stringify(this.moves));
		} else {
			throw RangeError('UNEXPECTED_TYPE');
		}
	}
	load() {
		this.abilities = Object.create(null);
		this.items = Object.create(null);
		this.moves = Object.create(null);
		let fileData = [
			['data-abilities.json', this.abilities],
			['data-items.json', this.items],
			['data-moves.json', this.moves],
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
	local(type: string, arg: string) {
		let DexData, dataLocal, Apisearch;
		if (type === 'Abilitie') {
			DexData = Plugins.Dex.getAbility;
			dataLocal = this.abilities;
			Apisearch = Api.searchAbilitie;
		} else if (type === 'Move') {
			DexData = Plugins.Dex.getMove;
			dataLocal = this.moves;
			Apisearch = Api.searchItem;
		} else if (type === 'Item') {
			DexData = Plugins.Dex.getItem;
			dataLocal = this.items;
			Apisearch = Api.searchItem;
		} else {
			return Promise.reject(`NO_DATA_FOUND`);
		}
		if (dataLocal[arg]) return Promise.resolve(dataLocal[arg]);
		let spanish: any = Dex.searchSpanish(arg);
		if (spanish && spanish.type === type) {
			return Promise.resolve(dataLocal[spanish.iteration]);
		}
		return new Promise((resolve, reject) => {
			let psData = DexData(arg);
			Apisearch(psData.num)
				.then(data => {
					dataLocal[arg] = data;
					this.save(type);
					resolve(data);
				})
				.catch(e => {
					reject(e);
				});
		});
	}
}
export const Storage = new PokeStorage();
