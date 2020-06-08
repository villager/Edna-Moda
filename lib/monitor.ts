import {FS} from './fs';

const logPath = './logs/errors.log';
const debugPath = './logs/debug.log';

export function log(error: any, data: AnyObject, server: string) {
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
	}).on('error', (err:any) => {
		console.error(`\nSUBCRASH: ${err.stack}\n`);
	});
}

export function debug(description: string) {
	const Stream = FS(debugPath).createWriteStream({flags: 'a'});
	Stream.on('open', () => {
		Stream.write(`\n${description}\n`);
		Stream.end();
	}).on('error', (err: any) => {
		console.error(`\nDEBUG CRASHED: ${err.stack}\n`);
	});
};
