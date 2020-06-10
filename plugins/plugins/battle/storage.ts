export let teams = Object.create(null);
export let autoJoin = Object.create(null);

const TEAMS_DIR = Plugins.resolve(__dirname, 'data', 'data-teams.json');
const AUTOJOIN_DIR = Plugins.resolve(__dirname, 'data', 'data-autojoin.json');

export const saveTeams = () => Plugins.FS(TEAMS_DIR).writeUpdate(() => JSON.stringify(teams));
export const saveJoins = () => Plugins.FS(AUTOJOIN_DIR).writeUpdate(() => JSON.stringify(autoJoin));

export function loadData() {
	let fileData = [
		['data-teams.json', teams],
		['data-autojoin.json', autoJoin],
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
export function isSaved(name: string) {
	if (teams[name]) return true;
	return false;
}
