import * as https from 'https';
import * as http from 'http';
import * as url from 'url';

export class Net {
	url: string;
	protocol: string;
	constructor(uri: string) {
		this.url = uri;
		this.protocol = url.parse(this.url).protocol as string;
	}
	get() {
		let net = this.protocol === 'https:' ? https : http;
		return new Promise((resolve, reject) => {
			net.get(this.url, res => {
				res.setEncoding('utf8');
				let data = '';
				res.on('data', chunk => {
					data += chunk;
				});
				res.on('end', () => {
					resolve(data);
				});
				res.on('error', err => {
					reject(err);
				});
			})
				.on('error', err => {
					reject(err);
				})
				.setTimeout(3500);
		});
	}
	toJSON() {
		return new Promise((resolve, reject) => {
			this.get()
				.then((data: any) => {
					let parseData;
					try {
						parseData = JSON.parse(data);
					} catch (e) {
						reject(e);
					}
					resolve(parseData);
				})
				.catch(e => {
					reject(e);
				});
		});
	}
	request(opts?: any) {
		let net = this.protocol === 'https:' ? https : http;
		let actionUrl = url.parse(this.url);
		let hostname = actionUrl.hostname as string;
		let options: any = {
			hostname: hostname,
			method: 'POST',
		};
		if (opts.header) options.header = opts.header;
		if (opts.port) options.port = opts.port;
		if (opts.path) options.path = opts.path;
		if (opts.method) options.method = opts.method;
		return new Promise((resolve, reject) => {
			let str = '';
			let req = net.request(options, res => {
				res.setEncoding('utf8');
				res.on('data', (chunk: string) => {
					str += chunk;
				});
				res.on('end', () => {
					resolve(str);
				});
			});
			req.on('error', (e: any) => {
				reject(e);
			});
			if (opts.data) req.write(opts.data);
			req.end();
		});
	}
}
export function UtilNetwork(uri: string) {
	return new Net(uri);
}
