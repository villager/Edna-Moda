'use strict';

const Storage = require('./storage');

exports.loadData = Storage.loadData;

exports.key = 'showdown';

function onParse(server, room, data, isIntro, spl) {
	if (spl[0] === 'j' || spl[0] === 'l') {
		if (isIntro) return;
		if (isBlackList(server.id, room, spl[1])) {
			server.send(`/roomban ${toId(spl[1])}, Usuario de la lista negra`, room);
		}
	}
}

exports.init = function () {
	Plugins.eventEmitter.on('PS_PARSE', onParse);
};

function addtoBlackList(server, room, user, target) {
	if (!Storage.blacklist[server]) Storage.blacklist[server] = {};
	if (!Storage.blacklist[server][room.id]) Storage.blacklist[server][room.id] = {};
	if (Storage.blacklist[server][room.id][toId(target)]) return;
	Storage.blacklist[server][room.id][toId(target)] = {
		by: user,
		date: Date.now(),
	};
	Storage.saveBlack();
}
function removeBlackList(server, room, user) {
	user = toId(user);
	if (!Storage.blacklist[server]) Storage.blacklist[server] = {};
	if (!Storage.blacklist[server][room.id]) Storage.blacklist[server][room.id] = {};
	if (!Storage.blacklist[server][room.id][user]) return false;
	delete Storage.blacklist[server][room.id][user];
	Storage.saveBlack();
}
function isBlackList(server, room, user) {
	user = toId(user);
	room = toId(room);
	if (!Storage.blacklist[server]) return false;
	if (!Storage.blacklist[server][room]) return false;
	if (Storage.blacklist[server][room][toId(user)]) return true;
	return false;
}
exports.commands = {
	blacklist: {
		add(target, room, user) {
			if (!this.can('ban', true)) return false;
			if (this.pmTarget) return this.sendReply('Este es un comando de sala');
			if (!target) return this.sendReply('Especifica un usuario');
			if (isBlackList(this.id, room, target)) return this.sendReply('El usuario ya estaba en la lista negra');
			addtoBlackList(this.id, room, user, target);
			this.sendReply(`Has agregado al usuario ${target} correctamente a la lista negra`);
		},
		remove(target, room) {
			if (!this.can('ban', true)) return false;
			if (this.pmTarget) return this.sendReply('Este es un comando de sala');
			if (!target) return this.sendReply('Especifica un usuario');
			if (!isBlackList(this.id, room, target)) return this.sendReply('El usuario no estaba en la lista negra');
			removeBlackList(this.id, room, target);
			this.sendReply(`Has eliminado al usuario ${target} de la lista negra`);
		},
		list(target, room) {
			if (!this.can('ban', true)) return false;
			if (this.pmTarget) return this.sendReply('Este es un comando de sala');
			if (!Storage.blacklist[this.id]) return this.sendReply('No hay ningun usuario registrado');
			if (!Storage.blacklist[this.id][room.id]) return this.sendReply('No hay ningun usuario registrado');
			let loadList = '';
			loadList += 'Usuarios de la lista negra \n';
			for (let i in Storage.blacklist[this.id][room.id]) {
				let user = Storage.blacklist[this.id][room.id][i];
				loadList += `${i} - añadido por ${user.by} el ${user.date}\n`;
			}
			Plugins.Bins.upload(loadList, (r, link) => {
				const fullLink = 'https://' + link;
				if (r) this.sendReply(`Lista de personas en la lista negra ${fullLink}`);
				else this.sendReply('Lo sentimos no pudimos generar la lista');
			});
		},
	},
};
