const API_LINK = 'https://pokeapi.co/api/v2';

function searchData(link: string) {
	return new Promise((resolve, reject) => {
		Plugins.Net(link)
			.toJSON()
			.then((data: AnyObject) => {
				let rawData: AnyObject = {spanish: {name: '', desc: ''}, english: {name: '', desc: ''}};
				for (const name of data.names) {
					if (name.language.name === 'es') {
						rawData.spanish.name = name.name;
					}
					if (name.language.name === 'en') {
						rawData.english.name = name.name;
					}
				}
				for (const flavor of data.flavor_text_entries) {
					if (flavor.language.name === 'es') {
						if (flavor.flavor_text) rawData.spanish.desc = flavor.flavor_text;
						else rawData.spanish.desc = flavor.text;
					}
					if (flavor.language.name === 'en') {
						if (flavor.flavor_text) rawData.english.desc = flavor.flavor_text;
						else rawData.english.desc = flavor.text;
					}
				}
				resolve(rawData);
			})
			.catch(e => reject(e));
	});
}
export function searchAbilitie(num: number) {
	return new Promise((resolve, reject) => {
		searchData(`${API_LINK}/ability/${num}`)
			.then(data => {
				return resolve(data);
			})
			.catch(e => reject(e));
	});
}
export function searchItem(num: number) {
	return new Promise((resolve, reject) => {
		searchData(`${API_LINK}/move/${num}`)
			.then(data => {
				return resolve(data);
			})
			.catch(e => reject(e));
	});
}
