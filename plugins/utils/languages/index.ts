
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
	get(lang: string, msg: string) {
		let language = lang;
		this.load();
		if (!this.translations[language]) throw Error(`Lenguaje ${language} no existe`);
		if (!this.translations[language][msg]) throw Error(`Mensaje ${msg} no existe en ${language}`);
		return this.translations[language][msg];
	}
	getSub(lang: string, msg: string, sub: string) {
		return this.get(lang, msg)[sub];
	}
	replaceSub(lang: string, msg: string, sub: string, ...args: string[]) {
		let i = 1;
		let output = this.get(lang, msg)[sub];
		for (const arg of args) {
			output = output.replace(`$${i}`, arg);
			i++;
		}
		return output;
	}
	replace(lang: string, msg: string, ...args: string[]) {
		let i = 1;
		let output = this.get(lang, msg);
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
