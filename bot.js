


global.Config = require('./config/config');

if(Config.servers['id1']) throw Error('Edit your config!');
global.Plugins = require('./plugins');

global.Monitor = require('./lib/monitor');

global.Chat = require('./chat');

let bots = Object.create(null);
function getBot(bot) {
    if(!bots[bot]) return false;
    return bots[bot];
}
global.Bot = getBot;

Bot.bots = bots;

Bot.forEach = function(callback, thisArg) {
    Object.values(bots).forEach(callback, thisArg);
};

global.toId = Plugins.Utils.toId;
global.splint = Plugins.Utils.splint;
global.toUserName = Plugins.Utils.toUserName;
Plugins.init();
let listeners = (Object.keys(Config.servers).length + 1) * Object.keys(Plugins.plugins).length;
Plugins.eventEmitter.setMaxListeners(listeners);
global.Discord = null

const PSBot = require('./showdown');
const DiscordBot = require('./discord');

class GBot {
    constructor() {
        if(Config.token && Config.name) {
            this.discord = Discord = new DiscordBot();
        }
        this.servers = Object.create(null);
        for (let i in Config.servers) {
            let Server = Config.servers[i];
            this.servers[i] = bots[i] = new PSBot(Server);

        }
    }
    connect() {
        for (let i in this.servers) {
            let Server = this.servers[i];
            Server.connect();
            /* Bot Status events */
            Server.on('connecting',  () => {
			    console.log('Connecting to server: ' + Server.id + ":" + Server.port);
		    });
		    Server.on('connect', () => {
			    console.log('Bot connected to server: ' + Server.id + ":" + Server.port);
	    	});
		    Server.on('disconnect', err => {
		    	console.log('Bot Disconnected' + (err ? (" | " + err.code + ": " + err.message) : ''));
                if (Server.manager.closed || Server.manager.connecting || Server.manager.status.connected) return;
                Server.manager.onBegin();
            });
            Chat.loadPlugins();
        }
        if(this.discord) this.discord.connect();
    }
}
const GlobalBot = global.GlobalBot = new GBot ();

GlobalBot.connect();