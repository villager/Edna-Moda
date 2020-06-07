'use strict';

const path = require('path');

let blacklist = Object.create(null);
const BLACK_LIST_PATH = path.resolve(__dirname, 'data', 'blacklist.json');

exports.saveBlack = () => Plugins.FS(BLACK_LIST_PATH).writeUpdate(() => JSON.stringify(blacklist));

exports.loadData = function () {
	let dataFiles = [['blacklist.json', blacklist]];
	for (const file of dataFiles) {
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
};
exports.blacklist = blacklist;
