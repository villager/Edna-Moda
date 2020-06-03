"use strict";

const FS = require('./fs');

const logPath = './logs/errors.log';
const debugPath = './logs/debug.log';

exports.log = function (error, data, server) {
    let stack = typeof error === 'string' ? error : error.stack;
    stack += '\nServer ID: ' + server;
	if (data) {
		stack += `\n\nAdditional information:\n`;
		for (const k in data) {
			stack += `  ${k} = ${data[k]}\n`;
		}
	}
	console.error(`\nCRASH: ${stack}\n`);
	const Stream = FS(logPath).createWriteStream({flags: 'a'});
    Stream.on('open', () => {
		Stream.write(`\n${stack}\n`);
		Stream.end();
	}).on('error', err => {
		console.error(`\nSUBCRASH: ${err.stack}\n`);
	});
};
exports.debug = function (description) {
	const Stream = FS(debugPath).createWriteStream({flags: 'a'});
    Stream.on('open', () => {
		Stream.write(`\n${description}\n`);
		Stream.end();
	}).on('error', err => {
		console.error(`\nDEBUG CRASHED: ${err.stack}\n`);
	});
};