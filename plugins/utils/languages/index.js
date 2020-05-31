"use strict";

const pathModule = require('path');
const ROOT_PATH = pathModule.resolve(__dirname, '..');

class  LoadLang {
    constructor(path) {
        if(!path) path = './base-lang.json';
		this.path = pathModule.resolve(ROOT_PATH, path);
        this.translations = Object.create(null);
        this.path = path;
    }
    load() {
        let langPackage = require(this.path);
        for (let i in langPackage) {
            this.translations[i] = langPackage[i];
        }
    }
    get(lang, msg) {
        let language = lang;
        this.load();
        if(!this.translations[language]) throw Error(`Lenguaje ${language} no existe`);
        if(!this.translations[language][msg]) throw Error(`Mensaje ${msg} no existe en ${language}`);        
        return this.translations[language][msg];
    }
    getSub (lang, msg, sub) {
        return this.get(lang, msg)[sub];
    }
    replaceSub(lang, msg, sub, ...args) {
        let i = 1;
        let output = this.get(lang, msg)[sub];
        for (const arg of args) {
            output = output.replace(`$${i}`, arg);
            i++;
        }
        return output;
    }
    replace(lang, msg, ...args) {
        let i = 1;
        let output = this.get(lang, msg);
        for (const arg of args) {
            output = output.replace(`$${i}`, arg);
            i++;
        }
        return output;
    }
}
function loadLang(langPath) {
    return new LoadLang(langPath);

};
exports.load = loadLang;

exports.loadHelp = function() {
    return new LoadLang('./helps.json');
};