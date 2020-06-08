const bins_list = ['https://hastebin.com', 'https://pastie.io'];

export class Bin {
	url: string;
	constructor(url?: string) {
		if (!url) url = bins_list[0];
		this.url = url;
	}
	upload(toUpload: string, callback: any) {
		Plugins.Net(this.url)
			.request({
				path: '/documents',
				data: toUpload,
			})
			.then((chunk: string) => {
				try {
					let linkStr = this.url + '/' + JSON.parse(chunk.toString())['key'];
					if (typeof callback === 'function') callback(true, linkStr);
				} catch (e) {
					if (typeof callback === 'function') callback(false, e);
				}
			})
			.catch((e: any) => {
				if (typeof callback === 'function') callback(false, e);
			});
	}
	download(key: string, callback: any) {
		if (typeof callback !== 'function') throw new Error('callback must be a function');
		let url = this.url + key;
		Plugins.Net(url)
			.get()
			.then((data: string) => {
				callback(data);
			})
			.catch((e: any) => {
				callback(null, e);
			});
	}
}
export function upload(toUpload: string, callback: any) {
	let Hastebin = new Bin();
	try {
		Hastebin.upload(toUpload, callback);
	} catch (e) {
		let Pastie = new Bin(bins_list[1]);
		Pastie.upload(toUpload, callback);
	}
}
export function download(key: string, callback: any) {
	let Hastebin = new Bin();
	try {
		Hastebin.download(key, callback);
	} catch (e) {
		let Pastie = new Bin(bins_list[1]);
		Pastie.download(key, callback);
	}
}
