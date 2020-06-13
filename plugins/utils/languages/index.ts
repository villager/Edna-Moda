/**
 * LoadLang is a local system
 * LoadHelp is a global system
 */

export class LoadLang {
	/**
	 * @param {string} path
	 */
	path: string;
	translations: AnyObject;
	constructor(path: string) {
		this.translations = Object.create(null);
		this.path = path;
		this.load();
	}
	load(): void {
		let langPackage = require(this.path);
		for (let i in langPackage) {
			this.translations[i] = langPackage[i];
		}
	}
	get(lang: string, msg: string | AnyObject, ...args: string[]): string {
		let language = lang;
		let output = '';
		if (!this.translations[language]) throw Error(`Lenguaje ${language} no existe`);
		if (typeof msg !== 'string') {
			if (!this.translations[language][msg.msg]) throw Error(`Mensaje ${msg.msg} no existe en ${language}`);
		} else {
			if (!this.translations[language][msg]) throw Error(`Mensaje ${msg} no existe en ${language}`);
		}
		if (typeof msg !== 'string') {
			output = this.translations[language][msg.msg][msg.in];
		} else {
			output = this.translations[language][msg];
		}
		let i = 1;
		for (const arg of args) {
			output = output.replace(`$${i}`, arg);
			i++;
		}
		return output;
	}
	static normalized(obj: AnyObject) {
		if (!obj.msg) throw RangeError('UNCAUGHT_LANGUAGE_NAME_ID');
		if (!obj.input) throw RangeError('UNCAUGHT_LANGUAGE_INNER_ID');
		if (Object.keys(obj).length > 2) throw RangeError('UNEXPECTED_PARAM');
		return obj;
	}
}

class LoadHelp {
	translations: AnyObject;
	constructor() {
		this.translations = Object.create(null);
	}
	add(file: string) {
		let data = require(file);
		for (let i in data) {
			if (!this.translations[i]) this.translations[i] = data[i];
			else Object.assign(this.translations[i], data[i]);
		}
	}
	get(lang: string, msg: string | AnyObject, ...args: string[]): string {
		let language = lang;
		let output = '';
		if (!this.translations[language]) throw Error(`Lenguaje ${language} no existe`);
		if (typeof msg !== 'string') {
			if (!this.translations[language][msg.msg]) throw Error(`Mensaje ${msg.msg} no existe en ${language}`);
		} else {
			if (!this.translations[language][msg]) throw Error(`Mensaje ${msg} no existe en ${language}`);
		}
		if (typeof msg !== 'string') {
			output = this.translations[language][msg.msg][msg.in];
		} else {
			output = this.translations[language][msg];
		}
		let i = 1;
		for (const arg of args) {
			output = output.replace(`$${i}`, arg);
			i++;
		}
		return output;
	}
}
/**
 * @param {string} langPath
 * @return {LoadLang}
 */
function loadLang(langPath?: string) {
	return new LoadLang(langPath);
}
export const load = loadLang;

export const Help = new LoadHelp();
