"use strict";

const https = require('https');

function upload(toUpload, callback) {
	let reqOpts = {
		hostname: "pastie.io",
		method: "POST",
		path: '/documents'
	};
	let req = https.request(reqOpts, res => {
		res.on('data', chunk => {
			try {
                console.log(JSON.parse(chunk.toString()));
				let linkStr = "pastie.io/" + JSON.parse(chunk.toString())['key'];
				if (typeof callback === "function") callback(true, linkStr);
			} catch (e) {
				if (typeof callback === "function") callback(false, e);
			}
		});
	});
	req.on('error', e => {
		if (typeof callback === "function") callback(false, e);
	});
	req.write(toUpload);
	req.end();
}
function download(key, callback) {
	if (typeof callback !== "function") throw new Error("callback must be a function");
	let url = 'https://pastie.io/raw/' + key;
	https.get(url, response => {
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
	}).on('error', err => {
		callback(null, err);
	});
}
exports.download = download;
exports.upload = upload;