"use strict";

const path = require('path');
const LANG_DIR = path.resolve(__dirname, 'language.json');
const { MessageEmbed } = require('discord.js');

const Lang = Plugins.Language.load(LANG_DIR);

const Dex = require('./lib/dex');
const Storage = require('./storage');

exports.key = 'discord';

exports.loadData = Storage.loadData;

const MAP_COLOR = new Map([
    ['Green', '#00FF76'],
    ['Red', '#FD4040'],
    ['Yellow', '#FCFF00'],
    ['Blue', '#1100FF'],
    ['Purple', '#F000FF'],
    ['Pink', '#FF0087'],
    ['Brown', '#7F6C06'],
    ['Gray', '#CCCCCC'],
]);
const TYPE_TO_COLOR = new Map([
    ['Grass', 'Green'],
    ['Fire', 'Red'],
    ['Electric', 'Yellow'],
    ['Water', 'Blue'],
    ['Fairy', 'Pink'],
    ['Fighting', 'Brown'],
    ['Normal', 'Gray']
]);
function embedPokemon(lang, poke) {
    poke = toId(poke);
    let data = Dex.getPokemon(poke);
    if(!data) return false;
    let name = data.name.toLowerCase();
    if(name.endsWith('-totem')) {
        name = name.replace('-totem', '');
    }
    let s = data.stats;
    let stats = '';
    for (let i in s) {
         stats+= `${Lang.getSub(lang, 'data', i)} ${s[i]} | `;
    }
    let abilities = [];
    data.abilities.map(abilitie => {
        let id = toId(abilitie).replace(' ', '');
        Storage.localAbilitie(id);
        abilities.push(Storage.abilities[id] ? Storage.abilities[id][lang].name : abilitie);
    });
    return new MessageEmbed({
        title: `**${data.name} #${data.num}**`,
        thumbnail : {
            width: 100,
            height: 100,
            url: `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`,
        },
        fields: [
            {name: Lang.get(lang, "hab"), value: abilities, inline: true},
            {name: Lang.get(lang, "group"), value: data.eggs, inline: true},
            {name: Lang.get(lang, "evolution"), value: data.evos ? data.evos : Lang.get(lang, "none"), inline: true},
            {name: Lang.get(lang, "types"), value: (data.types), inline: true},
            {name: "Gen", value: data.gen, inline: true}
        ],
        image: {url: `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`},
        footer: {
            text: stats,
        },
        color: MAP_COLOR.has(data.color) ? MAP_COLOR.get(data.color) : '#FFFFFF',
    })    
}

exports.init = function() {
}; 
exports.commands = {
    data: function(target) {
        if(!target) return this.sendReply(Lang.getSub(this.lang, 'data', 'target'));
        let data = false;
        switch(Dex.search(target)) {
            case 'Pokemon':
                data = embedPokemon(this.lang, target);
                this.sendReply(data);
            break;
            case 'Abilitie':
                Storage.localAbilitie(toId(target).replace(' ', '')).then(abilitie => {
                    let embed = new MessageEmbed({
                        title: `**${abilitie[this.lang].name}**`,
                        description: abilitie[this.lang].desc
                    });
                    this.sendReply(embed);
                });
            break;
            case 'Move':
                Storage.localMove(toId(target).replace(' ', '')).then(move => {
                    let embed = new MessageEmbed({
                        title: `**${move[this.lang].name}**`,
                        description: move[this.lang].desc,
                        color: TYPE_TO_COLOR.has(Dex.getMove(target).type) ? MAP_COLOR.get(TYPE_TO_COLOR.get(Dex.getMove(target).type)) : '#CCC'
                    });
                    this.sendReply(embed);
                });
            break;
            default: {
                this.sendReply(Lang.get(this.lang, '404'));
            }
        }
    }
};