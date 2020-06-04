"use strict";

const https = require("https");
const API_LINK = "https://pokeapi.co/api/v2";

function searchDataRaw(link) {
	return new Promise((resolve, reject) => {
		https
			.get(link, res => {
				let data = "";
				res.setEncoding("utf8");
				res.on("data", chunk => {
					data += chunk;
				}).on("end", () => {
					let parsedData;
					try {
						parsedData = JSON.parse(data);
					} catch (e) {
						return reject(e);
					}
					return resolve(parsedData);
				});
			})
			.on("error", err => {
				reject(err);
			})
			.setTimeout(3500);
	});
}
function searchData(link) {
	return new Promise((resolve, reject) => {
		searchDataRaw(link)
			.then(data => {
				let rawData = {spanish: {name: "", desc: ""}, english: {name: "", desc: ""}};
				for (const name of data.names) {
					if (name.language.name === "es") {
						rawData.spanish.name = name.name;
					}
					if (name.language.name === "en") {
						rawData.english.name = name.name;
					}
				}
				for (const flavor of data.flavor_text_entries) {
					if (flavor.language.name === "es") {
						if (flavor.flavor_text) rawData.spanish.desc = flavor.flavor_text;
						else rawData.spanish.desc = flavor.text;
					}
					if (flavor.language.name === "en") {
						if (flavor.flavor_text) rawData.english.desc = flavor.flavor_text;
						else rawData.english.desc = flavor.text;
					}
				}
				resolve(rawData);
			})
			.catch(e => reject(e));
	});
}
function searchAbilitie(num) {
	return new Promise((resolve, reject) => {
		searchData(`${API_LINK}/ability/${num}`)
			.then(data => {
				return resolve(data);
			})
			.catch(e => reject(e));
	});
}
function searchItem(num) {
	return new Promise((resolve, reject) => {
		searchData(`${API_LINK}/move/${num}`)
			.then(data => {
				return resolve(data);
			})
			.catch(e => reject(e));
	});
}
exports.searchAbilitie = searchAbilitie;
exports.searchItem = searchItem;
