export class LoadLang {
	/**
	 * @param {string} path
	 */
	path: string;
	translations: AnyObject;
	constructor(path?: string) {
		if (!path) path = './base-lang.json';
		this.translations = Object.create(null);
		this.path = path;
	}
	load() {
		let langPackage = require(this.path);
		for (let i in langPackage) {
			this.translations[i] = langPackage[i];
		}
	}
	get(lang: string, msg: string | AnyObject, ...args: string[]) {
		let language = lang;
		this.load();
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

export function loadHelp() {
	return new LoadLang('./helps.json');
}
