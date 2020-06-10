const ytdl = require('ytdl-core');

export const key = 'discord';
const streamOptions = {seek: 0, volume: 1};

export const commands: ChatCommands = {
	play(target, room, user, message) {
		this.guild.channels.cache.forEach(channel => {
			if (parseInt(channel.id) === 718722987351867413) {
				channel
					.join()
					.then(connection => {
						const stream = ytdl('https://www.youtube.com/watch?v=xkDabM0Cy-E', {filter: 'audioonly'});
						const dispatcher = connection.play(stream, streamOptions);
						dispatcher.on('end', () => channel.leave());
					})
					.catch(e => console.log(e));
			}
		});
	},
};
