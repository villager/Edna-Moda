"use strict";

const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, '../../logs/errors.log');
const debugPath = path.resolve(__dirname, '../../logs/debug.log');

exports.log = function(error, data, server) {
    let stack = typeof error === 'string' ? error : error.stack;
    stack += '\nServer ID: ' + server;
	if (data) {
		stack += `\n\nAdditional information:\n`;
		for (const k in data) {
			stack += `  ${k} = ${data[k]}\n`;
		}
	}
	console.error(`\nCRASH: ${stack}\n`);
	const Stream = fs.createWriteStream(logPath, {flags: 'a'});
    Stream.on('open', () => {
		Stream.write(`\n${stack}\n`);
		Stream.end();
	}).on('error', (err) => {
		console.error(`\nSUBCRASH: ${err.stack}\n`);
	});
};
exports.debug = function(description) {
	const Stream = fs.createWriteStream(debugPath, {flags: 'a'});
    Stream.on('open', () => {
		Stream.write(`\n${description}\n`);
		Stream.end();
	}).on('error', (err) => {
		console.error(`\nDEBUG CRASHED: ${err.stack}\n`);
	});
};