const LANG_DIR = Plugins.resolve(__dirname, 'language.json');

import {MessageEmbed} from 'discord.js';

const Lang = Plugins.Language.load(LANG_DIR);

import {Dex} from './lib/dex';

import {Storage} from './storage';

export const key = 'global';

export const loadData = Storage.load;

const mapColor = new Map([
	['Green', '#00FF76'],
	['Red', '#FD4040'],
	['Yellow', '#FCFF00'],
	['Blue', '#1100FF'],
	['Purple', '#F000FF'],
	['Pink', '#FF0087'],
	['Brown', '#7F6C06'],
	['Gray', '#CCCCCC'],
]);
const colorType = new Map([
	['Grass', 'Green'],
	['Fire', 'Red'],
	['Electric', 'Yellow'],
	['Water', 'Blue'],
	['Fairy', 'Pink'],
	['Fighting', 'Brown'],
	['Normal', 'Gray'],
]);
const pokeData = (lang: string, poke: string) => {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let name = data.name.toLowerCase();
	if (name.endsWith('-totem')) {
		name = name.replace('-totem', '');
	}
	let s = data.stats;
	let stats = '';
	for (let i in s) {
		stats += `${Lang.get(lang, {msg: 'data', in: i})} ${s[i]} | `;
	}
	let abilities = [];
	data.abilities.map(abilitie => {
		let id = toId(abilitie).replace(' ', '');
		Storage.local('Abilitie', id)
			.then(() => {})
			.catch(() => {});
		abilities.push(Storage.abilities[id] ? Storage.abilities[id][lang].name : abilitie);
	});
	return {name, stats, abilities};
};
const chatPokeText = (lang: string, poke: string) => {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD: any = pokeData(lang, poke);
	let output = '';
	output += `**${data.name} #${data.num}** |`;
	output += `${Lang.get(lang, 'hab')}: ${pD.abilities} |`;
	output += `${Lang.get(lang, 'group')}: ${data.eggs} |`;
	output += `${Lang.get(lang, 'evolution')}: ${data.evos ? data.evos : Lang.get(lang, 'none')} |`;
	output += `Gen: ${data.gen}`;
	return output;
};
const chatPokeHTML = (lang: string, poke: string) => {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD: any = pokeData(lang, poke);
	let output = '';
	output += `<center><strong>${data.name} #${data.num}</strong></center>`;
	output += `<table width="100%">`;
	output += `<td><img height="100" width="100" src="https://play.pokemonshowdown.com/sprites/gen5/${pD.name}.png"></td>`;
	output += `<td>`;
	output += `<strong>${Lang.get(lang, 'hab')}:</strong> ${pD.abilities}<br>`;
	output += `<strong>${Lang.get(lang, 'group')}:</strong> ${data.eggs}<br>`;
	output += `<strong>${Lang.get(lang, 'evolution')}:</strong> ${data.evos ? data.evos : Lang.get(lang, 'none')}<br>`;
	output += `<strong>${Lang.get(lang, 'types')}:</strong> ${data.types}<br>`;
	output += `<strong>Gen:</strong> ${data.gen}`;
	output += `</td>`;
	output += `<td><img src="https://play.pokemonshowdown.com/sprites/ani/${pD.name}.gif" width="100" height="100"></td>`;
	output += '</table>';
	output += `${pD.stats}`;
	return output;
};
const embedPokemon = (lang: string, poke: string) => {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD: any = pokeData(lang, poke);
	return new MessageEmbed({
		title: `**${data.name} #${data.num}**`,
		thumbnail: {
			width: 100,
			height: 100,
			url: `https://play.pokemonshowdown.com/sprites/gen5/${pD.name}.png`,
		},
		fields: [
			{name: Lang.get(lang, 'hab'), value: pD.abilities, inline: true},
			{name: Lang.get(lang, 'group'), value: data.eggs, inline: true},
			{
				name: Lang.get(lang, 'evolution'),
				value: data.evos ? data.evos : Lang.get(lang, 'none'),
				inline: true,
			},
			{name: Lang.get(lang, 'types'), value: data.types, inline: true},
			{name: 'Gen', value: data.gen, inline: true},
		],
		image: {url: `https://play.pokemonshowdown.com/sprites/ani/${pD.name}.gif`},
		footer: {
			text: pD.stats,
		},
		color: mapColor.has(data.color) ? mapColor.get(data.color) : '#FFFFFF',
	});
};

export const init = () => {
	for (const file of Storage.fileList) {
		let fullDir = `./.plugins-dist/plugins/smogon/data/${file}`;
		Plugins.Backup(fullDir).on();
	}
};
let typeList = new Set([
	'Fire',
	'Water',
	'Steel',
	'Rock',
	'Ground',
	'Flying',
	'Fighting',
	'Normal',
	'Ghost',
	'Dark',
	'Electric',
	'Fairy',
	'Dragon',
	'Ice',
	'Bug',
	'Grass',
	'Psychic',
	'Poison',
]);
export const loadWeak = (type): any => {
	let Type = Plugins.Dex.Chart.Type[type];
	if (!Type || !type) return false;
	let weakness = [];
	let resistances = [];
	let immunities = [];
	for (let i in Type.damageTaken) {
		let typeData = Type.damageTaken[i];
		if (!typeList.has(i)) continue;
		switch (typeData) {
			case 1: // Weak
				weakness.push(i);
				break;
			case 2: // Resistence
				resistances.push(i);
				break;
			case 3: // Inmune
				immunities.push(i);
				break;
		}
	}
	return {weak: weakness, resist: resistances, inmune: immunities};
};
const typeFormat = (type: string): string => {
	let fstLetter = type.charAt(0).toUpperCase();
	return fstLetter + type.slice(1);
};
export const commands: ChatCommands = {
	weakness(target) {
		let poke = Dex.getPokemon(target);
		if (!target) return this.sendReply(Lang.get(this.lang, {msg: 'data', in: 'target'}));
		if (poke) {
		} else {
			target = typeFormat(toId(target));
			if (!Plugins.Dex.Chart.Type[target]) {
				return this.sendReply(Lang.get(this.lang, {msg: 'data', in: 'target'}));
			} else {
				let data;
				let typeData = loadWeak(target);
				if (this.serverType === 'Showdown') {
				} else {
					data = `**${target}** es ${
						typeData.inmune.length
							? 'inmune a: ' + typeData.inmune.map(type => Lang.get(this.lang, type)).join(' ,')
							: ''
					}`;
					data += ` resistente a ${typeData.resist.map(type => Lang.get(this.lang, type)).join(', ')}`;
					data += ` y debil a ${typeData.weak.map(type => Lang.get(this.lang, type)).join(', ')}`;
				}
				this.sendReply(data);
			}
		}
	},
	weaknesstopic: 'pokedata',
	pokemon: 'dt',
	dt(target) {
		if (!target) return this.sendReply(Lang.get(this.lang, {msg: 'data', in: 'target'}));
		switch (Dex.search(target)) {
			case 'Pokemon':
				if (this.serverType === 'Showdown') {
					if (Plugins.hasAuth(this.id, this.bot.name, 'html')) {
						if (this.can('games', false)) {
							this.sendReply(`/addhtmlbox ${chatPokeHTML(this.lang, target)}`);
						} else {
							this.sendReply(chatPokeText(this.lang, target));
						}
					} else {
						this.sendReply(chatPokeText(this.lang, target));
					}
				} else {
					this.sendReply(embedPokemon(this.lang, target));
				}
				break;
			case 'Abilitie':
				Storage.local('Abilitie', toId(target).replace(' ', ''))
					.then(abilitie => {
						let data;
						if (this.serverType === 'Showdown') {
							data = `**${abilitie[this.lang].name}:** `;
							data += abilitie[this.lang].desc.replace('\n', ' ');
							this.sendReply(data);
						} else {
							data = new MessageEmbed({
								title: `**${abilitie[this.lang].name}**`,
								description: abilitie[this.lang].desc,
							});
						}
						this.sendReply(data);
					})
					.catch(() => {
						this.sendReply(Lang.get(this.lang, '404'));
					});
				break;
			case 'Move':
				Storage.local('Move', toId(target).replace(' ', ''))
					.then(move => {
						let data;
						if (this.serverType === 'Showdown') {
							data = `**${move[this.lang].name}**: ${move[this.lang].desc}`;
						} else {
							let type = Dex.getMove(target).type;
							let color = colorType.has(type) ? mapColor.get(colorType.get(type)) : '#CCC';
							data = new MessageEmbed({
								title: `**${move[this.lang].name}**`,
								description: move[this.lang].desc,
								color: color,
							});
						}
						this.sendReply(data);
					})
					.catch(() => {
						this.sendReply(Lang.get(this.lang, '404'));
					});
				break;
			default: {
				this.sendReply(Lang.get(this.lang, '404'));
			}
		}
	},
	dttopic: 'pokedata',
};
