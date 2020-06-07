'use strict';

//const ytdl = require('ytdl-core');

exports.key = 'discord';

exports.commands = {
	play(target, room, user, message) {
		this.guild.channels.cache.forEach(channel => {
			if (parseInt(channel.id) === 718722987351867413) {
				console.log('Entro aqui');
				channel
					.join()
					.then(connection => {
						connection.setMaxListeners(0);
						connection.play(
							'https://cdn.glitch.com/0c2bdbfc-5fce-47cd-a82f-7460fce155b2%2FAlexa_joins.mp3',
							{
								volume: '5',
							},
						);
					})
					.catch(e => console.log(e));
			}
		});
	},
};
