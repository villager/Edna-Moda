"use strict";

const path = require('path');
const psData = require('ps-data');
const Api = require('./lib/api');
const Dex = require('./lib/dex');

const ABILITIES_DIR = path.resolve(__dirname, 'data', 'abilities.json');
const ITEMS_DIR = path.resolve(__dirname, 'data', 'items.json');
const MOVES_DIR = path.resolve(__dirname, 'data', 'moves.json');

let abilities = exports.abilities = Object.create(null);

let items = exports.items = Object.create(null);

let moves = exports.moves = Object.create(null);

const saveAbilities = exports.saveAbilities = () => Tools.FS(ABILITIES_DIR).writeUpdate(() => JSON.stringify(abilities));
const saveItems = exports.saveItems = () => Tools.FS(ITEMS_DIR).writeUpdate(() => JSON.stringify(items));
const saveMoves = exports.saveMoves = () => Tools.FS(MOVES_DIR).writeUpdate(() => JSON.stringify(moves));

exports.loadData = function() {
    let fileData = [
        ['abilities.json', abilities],
        ['items.json', items],
        ['moves.json', moves],
    ]
    for (const file of fileData) {
        try {
            require.resolve(`./data/${file[0]}`);
        } catch(e) {Monitor.log(e)}
        try {
            let JSONdata = require(`./data/${file[0]}`);
            Object.assign(file[1], JSONdata);
        } catch(e){Monitor.log(e)}
    }
}

function localAbilitie(abilitie) {
    let psAbilitie = psData.getAbilities(8)[abilitie];
    if(abilities[abilitie]) return Promise.resolve(abilities[abilitie]);
    return new Promise((resolve, reject) => {
        Api.searchAbilitie(psAbilitie.num).then(data => {
            abilities[abilitie] = data;
            saveAbilities();
            resolve(data);
        }).catch(e => {reject(e)});
    })
}
function localItem(item) {
    let psItem = psData.getItems(8)[item];
    if(items[item]) return Promise.resolve(items[item]);
    return new Promise((resolve, reject) => {
        Api.searchItem(psItem.spritenum).then(data => {
            items[item] = data;
            saveItems();
            resolve(data);
        }).catch(e => {reject(e)});
    })
}
function localMove(move) {
    let psMove = psData.getMoves(8)[move];
    if(moves[move]) return Promise.resolve(moves[move]);
    return new Promise((resolve, reject) => {
        Api.searchItem(psMove.num).then(data => {
            moves[move] = data;
            saveMoves();
            resolve(data);
        }).catch(e => {reject(e)});
    })
}
exports.localAbilitie = localAbilitie;
exports.localItem = localItem;
exports.localMove = localMove;