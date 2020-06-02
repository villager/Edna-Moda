"use strict";

let teams = Object.create(null);
let autoJoin = Object.create(null);

const path = require('path');

const TEAMS_DIR = path.resolve(__dirname, 'data', 'teams.json');
const AUTOJOIN_DIR = path.resolve(__dirname, 'data', 'autojoin.json');

exports.saveTeams = () => Plugins.FS(TEAMS_DIR).writeUpdate(() => JSON.stringify(teams));
exports.saveJoins = () => Plugins.FS(AUTOJOIN_DIR).writeUpdate(() => JSON.stringify(autoJoin));

exports.loadData = function() {
    let fileData = [
        ['teams.json', teams],
        ['autojoin.json', autoJoin],
    ]
    for (const file of fileData) {
        try {
            require.resolve(`./data/${file[0]}`);
        } catch(e) {
            Monitor.log(e);
        }
        try {
            let JSONdata = require(`./data/${file[0]}`);
            Object.assign(file[1], JSONdata);
        } catch(e) {
            Monitor.log(e);
        }
    }
}
exports.isSaved = function(name) {
    if(teams[name]) return true;
    return false;
}
exports.teams = teams;
exports.autoJoin = autoJoin;
