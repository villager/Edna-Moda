import * as https from 'https';

export function upload(toUpload: string, callback: any) {
	let reqOpts = {
		hostname: 'hastebin.com',
		method: 'POST',
		path: '/documents',
	};
	let req = https.request(reqOpts, res => {
		res.on('data', chunk => {
			try {
				let linkStr = 'hastebin.com/' + JSON.parse(chunk.toString())['key'];
				if (typeof callback === 'function') callback(true, linkStr);
			} catch (e) {
				if (typeof callback === 'function') callback(false, e);
			}
		});
	});
	req.on('error', e => {
		if (typeof callback === 'function') callback(false, e);
	});
	req.write(toUpload);
	req.end();
}
export function download(key: string, callback: any) {
	if (typeof callback !== 'function') throw new Error('callback must be a function');
	let url = 'https://hastebin.com/raw/' + key;
	https
		.get(url, response => {
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				callback(data);
			});
			response.on('error', err => {
				callback(null, err);
			});
		})
		.on('error', err => {
			callback(null, err);
		});
}
