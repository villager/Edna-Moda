"use strict";

const path = require("path");
const LANG_DIR = path.resolve(__dirname, "language.json");
const {MessageEmbed} = require("discord.js");

const Lang = Plugins.Language.load(LANG_DIR);

const Dex = require("./lib/dex");
const Storage = require("./storage");

exports.key = ["discord", "showdown"];

exports.loadData = Storage.loadData;

const mapColor = new Map([
	["Green", "#00FF76"],
	["Red", "#FD4040"],
	["Yellow", "#FCFF00"],
	["Blue", "#1100FF"],
	["Purple", "#F000FF"],
	["Pink", "#FF0087"],
	["Brown", "#7F6C06"],
	["Gray", "#CCCCCC"],
]);
const colorType = new Map([
	["Grass", "Green"],
	["Fire", "Red"],
	["Electric", "Yellow"],
	["Water", "Blue"],
	["Fairy", "Pink"],
	["Fighting", "Brown"],
	["Normal", "Gray"],
]);
function pokeData(lang, poke) {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let name = data.name.toLowerCase();
	if (name.endsWith("-totem")) {
		name = name.replace("-totem", "");
	}
	let s = data.stats;
	let stats = "";
	for (let i in s) {
		stats += `${Lang.getSub(lang, "data", i)} ${s[i]} | `;
	}
	let abilities = [];
	data.abilities.map(abilitie => {
		let id = toId(abilitie).replace(" ", "");
		Storage.localAbilitie(id)
			.then(() => {})
			.catch(() => {});
		abilities.push(Storage.abilities[id] ? Storage.abilities[id][lang].name : abilitie);
	});
	return {name, stats, abilities};
}
function chatPokeText(lang, poke) {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD = pokeData(lang, poke);
	let output = "";
	output += `**${data.name} #${data.num}** |`;
	output += `${Lang.get(lang, "hab")}: ${pD.abilities} |`;
	output += `${Lang.get(lang, "group")}: ${data.eggs} |`;
	output += `${Lang.get(lang, "evolution")}: ${data.evos ? data.evos : Lang.get(lang, "none")} |`;
	output += `Gen: ${data.gen}`;
	return output;
}
function chatPokeHTML(lang, poke) {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD = pokeData(lang, poke);
	let output = "";
	output += `<center><strong>${data.name} #${data.num}</strong></center>`;
	output += `<table width="100%">`;
	output += `<td><img height="100" width="100" src="https://play.pokemonshowdown.com/sprites/gen5/${pD.name}.png"></td>`;
	output += `<td>`;
	output += `<strong>${Lang.get(lang, "hab")}:</strong> ${pD.abilities}<br>`;
	output += `<strong>${Lang.get(lang, "group")}:</strong> ${data.eggs}<br>`;
	output += `<strong>${Lang.get(lang, "evolution")}:</strong> ${data.evos ? data.evos : Lang.get(lang, "none")}<br>`;
	output += `<strong>${Lang.get(lang, "types")}:</strong> ${data.types}<br>`;
	output += `<strong>Gen:</strong> ${data.gen}`;
	output += `</td>`;
	output += `<td><img src="https://play.pokemonshowdown.com/sprites/ani/${pD.name}.gif" width="100" height="100"></td>`;
	output += "</table>";
	output += `${pD.stats}`;
	return output;
}
function embedPokemon(lang, poke) {
	poke = toId(poke);
	let data = Dex.getPokemon(poke);
	if (!data) return false;
	let pD = pokeData(lang, poke);
	return new MessageEmbed({
		title: `**${data.name} #${data.num}**`,
		thumbnail: {
			width: 100,
			height: 100,
			url: `https://play.pokemonshowdown.com/sprites/gen5/${pD.name}.png`,
		},
		fields: [
			{name: Lang.get(lang, "hab"), value: pD.abilities, inline: true},
			{name: Lang.get(lang, "group"), value: data.eggs, inline: true},
			{
				name: Lang.get(lang, "evolution"),
				value: data.evos ? data.evos : Lang.get(lang, "none"),
				inline: true,
			},
			{name: Lang.get(lang, "types"), value: data.types, inline: true},
			{name: "Gen", value: data.gen, inline: true},
		],
		image: {url: `https://play.pokemonshowdown.com/sprites/ani/${pD.name}.gif`},
		footer: {
			text: pD.stats,
		},
		color: mapColor.has(data.color) ? mapColor.get(data.color) : "#FFFFFF",
	});
}

exports.init = function () {};

exports.psCommands = {
	dt(target) {
		if (!target) return this.sendReply(Lang.getSub(this.lang, "data", "target"));
		switch (Dex.search(target)) {
			case "Pokemon":
				if (Chat.hasAuth(this.id, this.bot.name, "html")) {
					if (this.can("games", false)) {
						this.sendReply(`/addhtmlbox ${chatPokeHTML(this.lang, target)}`);
					} else {
						this.sendStrict(chatPokeText(this.lang, target));
					}
				} else {
					this.sendStrict(chatPokeText(this.lang, target));
				}
				break;
			case "Abilitie":
				Storage.localAbilitie(toId(target).replace(" ", ""))
					.then(abilitie => {
						let data = `**${abilitie[this.lang].name}:** `;
						data += abilitie[this.lang].desc.replace("\n", " ");
						this.sendReply(data);
					})
					.catch(() => {
						this.sendReply(Lang.get(this.lang, "404"));
					});
				break;
			default: {
				this.sendReply(Lang.get(this.lang, "404"));
			}
		}
	},
};
exports.discordCommands = {
	data(target) {
		if (!target) return this.sendReply(Lang.getSub(this.lang, "data", "target"));
		let data = false;
		switch (Dex.search(target)) {
			case "Pokemon":
				data = embedPokemon(this.lang, target);
				this.sendReply(data);
				break;
			case "Abilitie":
				Storage.localAbilitie(toId(target).replace(" ", ""))
					.then(abilitie => {
						let embed = new MessageEmbed({
							title: `**${abilitie[this.lang].name}**`,
							description: abilitie[this.lang].desc,
						});
						this.sendReply(embed);
					})
					.catch(() => {
						this.sendReply(Lang.get(this.lang, "404"));
					});
				break;
			case "Move":
				Storage.localMove(toId(target).replace(" ", ""))
					.then(move => {
						let type = Dex.getMove(target).type;
						let color = colorType.has(type) ? mapColor.get(colorType.get(type)) : "#CCC";
						let embed = new MessageEmbed({
							title: `**${move[this.lang].name}**`,
							description: move[this.lang].desc,
							color: color,
						});
						this.sendReply(embed);
					})
					.catch(() => {
						this.sendReply(Lang.get(this.lang, "404"));
					});
				break;
			default: {
				this.sendReply(Lang.get(this.lang, "404"));
			}
		}
	},
};
