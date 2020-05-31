"use strict";

const Config = exports;

Config.triggers = ['.', '*'];

Config.owners = [
    {
        id: 'owner1',
        aliases: ['owner1', 'discord_nick', 'ps_nick1'],
    }
];

/**
 * Pokemon Showdown Config
 */
Config.initCmds = [];

Config.rankList = ['+', '\u2605', '%', '@', '*', '#', '&', '~'];

Config.permissions = {
	'games': '+',
	'lock': '%',
	'ban': '@',
	'invite': '#',
	'forcewin': '&',
	'hotpatch': '~',
}

Config.servers = {
    "id1": {
        host: "0.0.0.0",
        port: 8000,
        id: "id1",
        name: "botname1",
        password: "botpassword1",
        rooms: ['lobby'],
        initCmds: ['/avatar nita'],
        language: "english",
    },
    "id2": {
        host: "1.0.1.0",
        port: 8080,
        id: "id2",
        name: "botname2",
        password: "botpassword2",
        rooms: ['lobby'],
        initCmds: ['/avatar clemont'],
        language: "spanish",
    }
};