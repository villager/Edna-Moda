"use strict";

const request = require('request');
const EventEmitter = require('events').EventEmitter;
const DEFAULT_ROOM = 'lobby';
const Parser = require('./parser');
const Room = require('./rooms');
const SockJS = require('sockjs-client');
const Manager = require('./managers');
let roomList = Object.create(null);

class PSBot extends EventEmitter {
    constructor(opts) {
		super();
		// Config Provided
        this.id = opts.id;
        this.host = opts.host;
        this.port = opts.port;
		this.name = opts.name;
		this.pass = opts.password;
		this.baseRooms = opts.rooms || 'lobby';
		this.initCmds = opts.initCmds;
		this.language = opts.language || 'english';
		// Objects
		this.rooms = Object.create(null);
		this.formats = Object.create(null);
		this.commands = Object.create(null);
		this.disconnecting = false;
		this.named = false;
        this.joinedRooms = false;
        this.roomcount = 0;
        this.challengekeyid = '';
		this.challenge = '';
		this.group = '';

		this.users = new Map();
		this.parser = new Parser(this);
		this.manager = new Manager.Connection(this);
		this.roomManager = new Manager.Room(this);

		this.sending = {};
		this.nextSend = 0;
		this.maxLinesSend = 3;
		this.socket = null;
	}
    get botNick() {
        return this.bot.name;
	}
	reset() {
		for (let k in this.sending) {
			this.sending[k].kill();
			delete this.sending[k];
		}
        this.nextSend = 0;
        for (let i in this.rooms) {
            delete this.rooms[i];
        }
		this.manager.conntime = 0;
	}
    connect() {
		if (this.manager.status.connected || this.socket) return;
		this.manager.closed = false;
		this.reset();
        this.socket = new SockJS(`http://${this.host}:${this.port}/showdown/`);
		this.socket.onerror = () => {
			this.manager.connecting = false;
			this.reset();
			if (this.socket) {
				this.socket.close();
				this.socket = null;
			}
			this.emit('disconnect');
		};
		this.socket.onopen = () => {
			this.manager.connecting = false;
			//this.status.onConnection();
			this.manager.conntime = Date.now();
			this.initPlugins();
			this.manager.attemps = 0;
			this.emit('connect', this.socket);
		};
		this.socket.onclose = e => {
			if (!this.manager.closed) this.socket = null;
			this.manager.connecting = false;
			this.reset();
			this.emit('disconnect', {code: e.code, message: e.reason});
		};
		this.socket.onmessage = e => {
			let data = e.data;
			if (typeof data !== "string") {
				data = JSON.stringify(data);
			}
			this.emit('message', data);
			this.receive(data);
			this.manager.activity.date = Date.now();
		};
		this.manager.connecting = true;
		this.emit('connecting');
	}
	loadCommands() {
		Chat.loadPlugins();
		Plugins.eventEmitter.emit('onDynamic', this).flush();
		Object.assign(this.commands, Chat.psCommands); // Assign base PS commands
	}
	initPlugins() {
		Plugins.forEach(plugin => {
			if (typeof plugin.init === 'function') {
				plugin.init(this);
			}
		});
		this.loadCommands();
	}
	receive(msg) {
        this.emit('message', msg);
		this.receiveMsg(msg);
	}
	receiveMsg(msg) {
		if (!msg) return;
		if (msg.includes('\n')) {
			let lines = msg.split('\n');
			let room = DEFAULT_ROOM;
			let firstLine = 0;
			if (lines[0].charAt(0) === '>') {
				room = lines[0].substr(1) || DEFAULT_ROOM;
				firstLine = 1;
			}
			for (let i = firstLine; i < lines.length; i++) {
				if (lines[i].split('|')[1] === 'init') {
					for (let j = i; j < lines.length; j++) {
						this.parseLine(room, lines[j], true);
					}
					break;
				} else {
					this.parseLine(room, lines[i], false);
				}
			}
		} else {
			this.parseLine(DEFAULT_ROOM, msg, false);
		}
	}
    parseLine(roomid, data, isInit) {
		let splittedLine = data.substr(1).split('|');
		Plugins.eventEmitter.emit('PS_PARSE', this, roomid, data, isInit, splittedLine).flush();
		switch (splittedLine[0]) {
		case 'error':
			console.log(splittedLine[1]);
			break;
		case 'formats':
			let formats = data.substr(splittedLine[0].length + 2);
			this.updateFormats(formats);
			this.emit('formats', formats);
			break;
		case 'challstr':
			this.challengekeyid = splittedLine[1];
			this.challenge = splittedLine[2];
			this.login(this.name, this.pass);
			break;
		case 'c:':
			if (isInit) break;
			this.parser.parse(this.rooms[roomid], splittedLine[2], splittedLine.slice(3).join('|'), false);
			break;
		case 'c':
			if (isInit) break;
			this.parser.parse(this.rooms[roomid], splittedLine[1], splittedLine.slice(2).join('|'), false);
			break;
		case 'updateuser':
			if (toId(splittedLine[1]) !== toId(this.name)) return;
			this.send('/cmd rooms');
			let cmds = Plugins.initCmds();
			for (const cmd of cmds) this.send(cmd);
			if (!this.joinedRooms && splittedLine[2] === '1') {
				this.roomManager.onBegin();
			}
			break;
		case 'pm':
			this.parser.parse(roomid, splittedLine[1], splittedLine.slice(3).join('|'), true);
			break;
		case 'join':
		case 'j':
		case 'J':
			if (isInit) break; // no nos interesa del pasado
			break;
		case 'l':
		case 'L':
			if (isInit) break; // no nos interesa del pasado
			break;
		case 'init':
			this.rooms[roomid] = new Room(roomid, {
				type: splittedLine[1],
			});
			this.roomcount = Object.keys(this.rooms).length;
			this.emit('joinRoom', roomid, this.rooms[roomid].type);
			break;
		case 'deinit':
			if (this.rooms[roomid]) {
				this.emit('leaveRoom', this.rooms[roomid]);
				delete this.rooms[roomid];
				this.roomcount = Object.keys(this.rooms).length;
			}
			break;
		case 'title':
			if (this.rooms[roomid]) {
				this.rooms[roomid].updateTitle(splittedLine[1]);
			}
			break;
		case 'users':
			if (this.rooms[roomid]) break;
				let userArr = data.substr(9).split(",");
				this.rooms[roomid].updateUsers(userArr);
			break;
		case 'raw':
		case 'html':
			break;
		case 'queryresponse':
			switch (splittedLine[1]) {
				case 'userdetails':
					let data = JSON.parse(splittedLine[2]);
					if (data.id !== toId(this.name)) {
						let data = JSON.parse(splittedLine[2]);
						if (data.group) this.group = data.group;
					}
				break;
			case 'rooms':
				if (splittedLine[2] === 'null') break;
                let roomData = JSON.parse(splittedLine.slice(2));
                if (!roomList[this.id]) {
                    roomList[this.id] = {};
                }
                for (let i in roomData['official']) {
                    if (!roomList[this.id].isOfficial) roomList[this.id].isOfficial = [];
					roomList[this.id].isOfficial.push(roomData['official'][i].title);
                }
                for (let i in roomData['chat']) {
                    if (!roomList[this.id].isChat)roomList[this.id].isChat = [];
                    roomList[this.id].isChat.push(roomData['chat'][i].title);
                }
				if (!this.joinedRooms) {
					if (this.baseRooms[0] === 'all') {
						this.joinAllRooms();
						this.joinedRooms = true;
					} else if (this.baseRooms === 'official') {
						this.joinAllRooms();
						this.joinedRooms = true;
					}
				}
				break;
			}
			break;
		case 'N':
			if (~data.indexOf('\n')) {
			//	this.logChat(toId(roomid), data.trim());
			}
			break;
		case '':
			//this.logChat(toId(roomid), parts.slice(2).join('|'));
			break;
		}
    }
	updateFormats(formats) {
		let formatsArr = formats.split('|');
		let commaIndex, formatData, code, name;
		this.formats = {};
		for (let i = 0; i < formatsArr.length; i++) {
			commaIndex = formatsArr[i].indexOf(',');
			if (commaIndex === -1) {
				this.formats[toId(formatsArr[i])] = {name: formatsArr[i],
					team: true, ladder: true, chall: true};
			} else if (commaIndex === 0) {
				i++;
				continue;
			} else {
				name = formatsArr[i];
				formatData = {name: name, team: true, ladder: true, chall: true};
				code = commaIndex >= 0 ? parseInt(name.substr(commaIndex + 1), 16) : NaN;
				if (!isNaN(code)) {
					name = name.substr(0, commaIndex);
					if (code & 1) formatData.team = false;
					if (!(code & 2)) formatData.ladder = false;
					if (!(code & 4)) formatData.chall = false;
					if (!(code & 8)) formatData.disableTournaments = true;
				} else {
					if (name.substr(name.length - 2) === ',#') { // preset teams
						formatData.team = false;
						name = name.substr(0, name.length - 2);
					}
					if (name.substr(name.length - 2) === ',,') { // search-only
						formatData.chall = false;
						name = name.substr(0, name.length - 2);
					} else if (name.substr(name.length - 1) === ',') { // challenge-only
						formatData.ladder = false;
						name = name.substr(0, name.length - 1);
					}
				}
				formatData.name = name;
				this.formats[toId(name)] = formatData;
			}
		}
	}
	parseAliases(format) {
		if (!format) return '';
		format = toId(format);
		let aliases = Config.formatAliases || {};
		if (this.formats[format]) return format;
		if (aliases[format]) format = toId(aliases[format]);
		if (this.formats[format]) return format;
		return format;
	}
	send(data, room) {
		if (!room) room = '';
		if (!(data instanceof Array)) {
			data = [data.toString()];
		}
		for (let i = 0; i < data.length; i++) {
			data[i] = (room + '|' + data[i]);
		}
		return this.sendBase(data);
	}
	getSendId() {
		return this.nextSend++;
	}
    sendBase(data) {
		if (!this.socket) return null;
		let id = this.getSendId();
		let manager = new Manager.Send(data, 3,
			function (msg) {
				this.socket.send(msg);
				this.emit('send', msg);
			}.bind(this),

			function () {
				delete this.sending[id];
			}.bind(this),
		);
		this.sending[id] = manager;
		manager.start();
		return manager;
    }
    login(name, pass) {
		let self = this;
		let options;
		if (pass !== '') {
			options = {
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
				},
				url: 'http://play.pokemonshowdown.com/action.php',
				body: "act=login&name=" + encodeURIComponent(name) + "&pass=" + encodeURIComponent(pass) + "&challengekeyid=" + this.challengekeyid + "&challenge=" + this.challenge,
			};
			request.post(options, callback);
		} else {
			options = {
				url: 'http://play.pokemonshowdown.com/action.php?act=getassertion&userid=' + toId(name) + '&challengekeyid=' + this.challengekeyid + '&challenge=' + this.challenge,
			};
			request(options, callback);
		}
		/**
		 * @param {Error} error
		 * @param {string} response
		 * @param {string} body
		 */
		function callback(error, response, body) {
			if (body === ';') return console.log('Failed to log in, name is registered', self.id);
			if (body.length < 50) return console.log('Failed to log in: ' + body, self.id);
			if (~body.indexOf('heavy load')) {
				console.log('Failed to log in - login server is under heavy load. Retrying in one minute.', self.id);
				setTimeout(function () {
					self.login(name, pass);
				}, 60 * 1000);
				return;
			}
			if (body.substr(0, 16) === '<!DOCTYPE html>') {
				console.log('Connection error 522 - retrying in one minute', self.id);
				setTimeout(function () {
					self.login(name, pass);
				}, 60 * 1000);
				return;
			}
			try {
				let json = JSON.parse(body.substr(1, body.length));
				if (json.actionsuccess) {
					self.named = true;
					self.send('/trn ' + name + ',0,' + json['assertion']);
					self.roomManager.onBegin();
				} else {
					console.log('Could not log in: ' + JSON.stringify(json), self.id);
				}
			} catch (e) {
				self.named = true;
				self.send('/trn ' + name + ',0,' + body);
				self.roomManager.onBegin();
			}
		}
    }
    joinRoom(room) {
        if (this.rooms[room]) return; // Ya estaba en la sala
		this.rooms[room] = new Room(room);
        this.send(`/join ${room}`);
    }
    joinAllRooms() {
        if (!roomList[this.id]) return;
        for (let i in roomList[this.id]) {
            for (const room of roomList[this.id][i]) {
                this.joinRoom(room);
            }
        }
	}
}

module.exports = PSBot;