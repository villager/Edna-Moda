"use strict";

const path = require('path');
let dyns = Object.create(null);
const PHRASES_DIR = path.resolve(__dirname, 'data', 'dyn.json');
const Lang = Plugins.Language.load(path.resolve(__dirname, 'dyn-language.json'));
let saveDyns = () => Tools.FS(PHRASES_DIR).writeUpdate(() => JSON.stringify(dyns));

exports.key = ['global', 'discord', 'showdown'];

function loadCmdDyns(list, commandsHandler) {
    for (let i in list) {
        commandsHandler[i] = function() {
            this.sendReply(list[i].action);
        }
    }
}
function initDyns(server) {
    for (let i in dyns) {
        if(server.id === i) loadCmdDyns(dyns[i], server.commands);
    }
}
exports.loadData = function() {
    try {
        require.resolve('./data/dyn.json');
    } catch(e) {
        Monitor.log(e);
    }
    try {
        let JSONdata = require('./data/dyn.json');
        Object.assign(dyns, JSONdata);
    } catch(e) {
        Monitor.log(e);
    }
};
exports.init = function(server) {
    Plugins.eventEmitter.on('onDynamic', initDyns);
};

exports.globalCommands = {
    dyn(target) {
        if(!dyns[this.id]) return this.sendReply(Lang.get(this.lang, 'non_server_exist'));
        if(!dyns[this.id][target]) return this.sendReply(Lang.get(this.lang, 'non_exist'));
        this.sendReply(`Dyn: ${dyns[this.id][target].action}`);
    },
    setdyn(target) {
        if(!this.can('mute', true)) return false;
        if(!dyns[this.id]) dyns[this.id] = {};
        console.log(target);
        target = this.splitOne(target);
        console.log(target);
        if(dyns[this.id][target[0]]) return this.sendReply('Ya existe el comando indicado');
        if(!target[1]) return this.sendReply('especifica la accion');
        dyns[this.id][target[0]] = {
            action: target[1],
            aliases: [],
        }
        saveDyns();
        this.sendReply(`Dynamic command saved as ${target[0]}`);
    },
};
exports.discordCommands = {

};
exports.psCommands = {
    dynlist: 'listdyn',
    listdyn() {
        if(!dyns[this.id]) return this.sendReply(Lang.getSub(this.lang, 'dyn', 'non_server_exist'));       
        let data = '';
        data += Lang.get(this.lang, 'header') + '\n';
        for (let i in dyns[this.id]) {
            let dyn = dyns[this.id][i];
            data += `${i} -> ${dyn.action} `;
            if(dyn.aliases.length > 0) {
                data += '(';
                for (const alias of dyn.aliases) {
                    data += alias + ', ';
                }
                data += ')';
            }
            data += '\n';
        }
        console.log(data);
        Tools.Hastebin.upload(data, (r, link) => {
            if(r) {
                this.sendReply(`${Lang.get(this.lang, 'header')}: ${link}`);
            } else {
                this.sendReply(`${Lang.get(this.lang, 'list_error')}`);
            }
        })
    }
};