"use strict";

const request = require('request');
const EventEmitter = require('events').EventEmitter;
const DEFAULT_ROOM = 'lobby';
const Parser = require('./parser');
const Room = require('./rooms');
const SockJS = require('sockjs-client');

let roomList = Object.create(null);

class PSBot extends EventEmitter {
    constructor(opts) {
        super();
        this.id = opts.id;
        this.host = opts.host;
        this.connected = false;
        this.port = opts.port;
		this.rooms =  Object.create(null);
		this.name = opts.name;
		this.pass = opts.password;
		this.named = false;
        this.baseRooms = opts.rooms;
        this.formats = Object.create(null);
        this.lastMessage = undefined;
        this.disconnecting = false;
        this.joinedRooms = false;
        this.roomcount = 0;
        this.challengekeyid = '';
		this.challenge = '';
		this.autoreconnect = true;
		this.users = new Map();
		this.group = '';
		this.language = opts.language;
		this.parser = new Parser(this);
		this.sending = {};
		this.nextSend = 0;
		this.maxLinesSend = 3;
        this.socket = null;    

    }
    get botNick() {
        return this.bot.name;
	}
	reset() {
		if (this.connectionRetryTimer) {
			clearTimeout(this.connectionRetryTimer);
			this.connectionRetryTimer = null;
		}
		if (this.loginRetryTimer) {
			clearTimeout(this.loginRetryTimer);
			this.loginRetryTimer = null;
		}
		for (let k in this.sending) {
			this.sending[k].kill();
			delete this.sending[k];
		}
        this.nextSend = 0;
        for (let i in this.rooms) {
            delete this.rooms[i];
        }
		this.conntime = 0;
	}
    connect() {
		if (this.connected || this.socket) return;
		this.closed = false;
		this.reset();
        this.socket = new SockJS(`http://${this.host}:${this.port}/showdown/`);
		this.socket.onerror = function () {
			this.connecting = false;
			this.reset();
			if (this.socket) {
				this.socket.close();
				this.socket = null;
			}
			this.emit('disconnect');
		}.bind(this);
		this.socket.onopen = function () {
			this.connecting = false;
			//this.status.onConnection();
			this.conntime = Date.now();
			console.log(`Conectado a ${this.id}`);
			this.emit('connect', this.socket);
		}.bind(this);
		this.socket.onclose = function (e) {
			if (!this.closed) this.socket = null;
			this.connecting = false;
			this.reset();
			this.emit('disconnect', {code: e.code, message: e.reason});
		}.bind(this);
		this.socket.onmessage = function (e) {
			let data = e.data;
			if (typeof data !== "string") {
				data = JSON.stringify(data);
			}
			this.lastMessage = Date.now();
			Chat.loadPlugins();
			this.emit('message', data);
			this.receive(data);
		}.bind(this);
		this.connecting = true;
		this.emit('connecting');

    }
	receive(msg) {
        this.lastMessage = Date.now();
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
		this.emit('on', this, roomid, data, isInit, splittedLine);
		if (splittedLine[0]) {
			var thisEvent = (splittedLine[0].charAt(0) !== '-') ? 'major' : 'minor';
			this.emit(thisEvent, roomid, splittedLine[0], data.substr(splittedLine[0].length + 2), isInit);
		} else {
			this.emit('major', roomid, '', data, isInit);
		}
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
			if(isInit) break;
			this.parser.parse(this.rooms[roomid], splittedLine[2], splittedLine.slice(3).join('|'), false);
			break;
		case 'c':
			if(isInit) break;
			this.parser.parse(this.rooms[roomid], splittedLine[1], splittedLine.slice(2).join('|'), false);
			break;
		case 'updateuser':
			if (toId(splittedLine[1]) !== toId(this.name)) return;
			this.send('/cmd rooms');
			let cmds = [];
			for (const cmd of cmds) this.send(cmd);
			if (!this.joinedRooms && splittedLine[2] === '1') {
				if (Array.isArray(this.baseRooms)) {
                    for (const room of this.baseRooms) this.joinRoom(room);
					this.joinedRooms = true;
				}
			}
			break;
		case 'pm':
			this.parser.parse(roomid, splittedLine[1], splittedLine.slice(3).join('|'), true);
			break;
		case 'join':
		case 'j':
		case 'J':
			if(isInit) break; // no nos interesa del pasado
			break;
		case 'l':
		case 'L':
			if(isInit) break; // no nos interesa del pasado
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
					if(data.id !== toId(this.name)){
						let data = JSON.parse(splittedLine[2]);
						if(data.group) this.group = data.group;						
					}
				break;
			case 'rooms':
				if (splittedLine[2] === 'null') break;
                let roomData = JSON.parse(splittedLine.slice(2));
                if(!roomList[this.id]) {
                    roomList[this.id] = {};
                }
                for (let i in roomData['official']) {
                    if(!roomList[this.id].isOfficial) roomList[this.id].isOfficial = [];
					roomList[this.id].isOfficial.push(roomData['official'][i].title);
                }
                for (let i in roomData['chat']) {
                    if(!roomList[this.id].isChat)roomList[this.id].isChat = [];
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
	send(data, room) {
		if(!room) room = '';
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
		let manager = new SendManager(data, 3,
			function (msg) {
				this.socket.send(msg);
				this.emit('send', msg);
			}.bind(this),

			function () {
				delete this.sending[id];
			}.bind(this)
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
					'content-type': 'application/x-www-form-urlencoded'
				},
				url: 'http://play.pokemonshowdown.com/action.php',
				body: "act=login&name=" + encodeURIComponent(name) + "&pass=" + encodeURIComponent(pass) + "&challengekeyid=" + this.challengekeyid + "&challenge=" + this.challenge
			};
			request.post(options, callback);
		} else {
			options = {
				url: 'http://play.pokemonshowdown.com/action.php?act=getassertion&userid=' + toId(name) + '&challengekeyid=' + this.challengekeyid + '&challenge=' + this.challenge
			};
			request(options, callback);
		}
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
				var json = JSON.parse(body.substr(1, body.length));
				if (json.actionsuccess) {
					self.named = true;
					self.send('/trn ' + name + ',0,' + json['assertion']);
				} else {
					console.log('Could not log in: ' + JSON.stringify(json), self.id);
				}
			} catch (e) {
				self.named = true;
				self.send('/trn ' + name + ',0,' + body);
			}
		}
    }
    joinRoom(room) {
        if(this.rooms[room]) return; // Ya estaba en la sala
		this.rooms[room] =  new Room(room);
        this.send(`/join ${room}`);
    }
    joinAllRooms() {
        if(!roomList[this.id]) return;
        for (let i in roomList[this.id]) {
            for (const room of roomList[this.id][i]) {
                this.joinRoom(room);
            }
        }
	}
}
class SendManager {
	/**
	 * @param {String|Array<String>} data
	 * @param {Number} msgMaxLines
	 * @param {function(String)} sendFunc
	 * @param {function} destroyHandler
	 */
	constructor(data, msgMaxLines, sendFunc, destroyHandler) {
		this.data = data;
		this.msgMaxLines = msgMaxLines;
		this.sendFunc = sendFunc;
		this.status = 'sending';
		this.callback = null;
		this.destroyHandler = destroyHandler;
		this.err = null;
		this.interval = null;
	}

	start() {
		let data = this.data;
		if (!(data instanceof Array)) {
			data = [data.toString()];
		} else {
			data = data.slice();
		}
		let nextToSend = function () {
			if (!data.length) {
				clearInterval(this.interval);
				this.interval = null;
				this.finalize();
				return;
			}
			let toSend = [];
			let firstMsg = data.shift();
			toSend.push(firstMsg);
			let roomToSend = "";
			if (firstMsg.indexOf('|') >= 0) {
				roomToSend = firstMsg.split('|')[0];
			}
			while (data.length > 0 && toSend.length < this.msgMaxLines) {
				let subMsg = data[0];
				if (subMsg.split('|')[0] !== roomToSend) {
					break;
				} else {
					toSend.push(subMsg.split('|').slice(1).join('|'));
					data.shift();
				}
			}
			this.sendFunc(toSend.join('\n'));
		};
		this.interval = setInterval(nextToSend.bind(this), 2000);
		nextToSend.call(this);
	}

	finalize() {
		this.status = 'finalized';
		if (typeof this.callback === "function") this.callback(this.err);
		if (typeof this.destroyHandler === "function") this.destroyHandler(this);
	}

	/**
	 * @param {function} callback
	 */
	then(callback) {
		if (this.status !== 'sending') {
			return callback(this.err);
		} else {
			this.callback = callback;
		}
	}

	kill() {
		if (this.interval) clearInterval(this.interval);
		this.interval = null;
		this.err = new Error("Send Manager was killed");
		this.finalize();
	}
}

module.exports = PSBot;