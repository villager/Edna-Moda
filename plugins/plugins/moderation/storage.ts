
export let blacklist = Object.create(null);
const BLACK_LIST_PATH = Plugins.resolve('data', 'data-blacklist.json');

export const saveBlack = () => Plugins.FS(BLACK_LIST_PATH).writeUpdate(() => JSON.stringify(blacklist));

export function loadData() {
	let dataFiles = [['data-blacklist.json', blacklist]];
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
}
